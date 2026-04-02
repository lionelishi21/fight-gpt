import { AnalysisRequest, AnalysisResponse, ApiResponse } from '../types';
import { IAnalysisRepository } from '../repositories/AnalysisRepository';
import { IAiService } from './AiService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { ICharacterService } from './CharacterService';
import { BaseService } from './BaseService';
import { UuidHelper } from '../helpers/uuidHelper';
import { formatFullGameContextForAI } from '../helpers/aiContextHelper';
import { AiPromptHelper, CharacterAnalysisData } from '../helpers/aiPromptHelper';
import { IGameMetadata, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { IVectorRepository } from '../repositories/VectorRepository';

/**
 * Analysis Service interface
 * Follows Interface Segregation Principle
 */
export interface IAnalysisService {
  analyzeVideo(request: AnalysisRequest): Promise<ApiResponse<AnalysisResponse>>;
  getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResponse>>;
  getRecentAnalyses(limit: number): Promise<ApiResponse<AnalysisResponse[]>>;
}

/**
 * Analysis Service implementation
 * Follows Single Responsibility Principle - orchestrates analysis workflow
 * Follows Dependency Inversion Principle - depends on repository and AI service interfaces
 */
export class AnalysisService extends BaseService implements IAnalysisService {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly aiService: IAiService,
    private readonly gameMetadataService: IGameMetadataService,
    private readonly characterEncyclopediaService: ICharacterEncyclopediaService,
    private readonly characterService?: ICharacterService, // Optional: for character name lookup
    private readonly vectorRepository?: IVectorRepository
  ) {
    super();
  }

  /**
   * Analyze video - checks cache first, then calls AI service if needed
   */
  async analyzeVideo(request: AnalysisRequest): Promise<ApiResponse<AnalysisResponse>> {
    try {
      // Validate request
      this.validateAnalysisRequest(request);

      // Check cache first
      const cachedAnalysis = await this.getCachedAnalysis(request);
      if (cachedAnalysis) {
        return {
          success: true,
          data: cachedAnalysis.analysis as AnalysisResponse,
          message: 'Analysis retrieved from cache',
        };
      }

      // Enrich request with game metadata and character rules if game_id is provided
      const enrichedRequest = await this.enrichRequestWithGameContext(request);

      // Call AI service for new analysis
      const analysisResponse = await this.aiService.analyzeVideo(enrichedRequest);

      // Generate analysis ID
      const analysisId = UuidHelper.generate();

      // Cache the result
      await this.analysisRepository.createAnalysis(request, analysisResponse, analysisId);

      // --- VECTOR STORAGE INTEGRATION ---
      if (this.vectorRepository && analysisResponse.timeline) {
        for (const event of analysisResponse.timeline) {
          try {
            // Generate a combined context string for the embedding
            const contextText = `Game: ${request.game_id || 'Unknown'}. ` +
              `Matchup: ${analysisResponse.p1_character || 'P1'} vs ${analysisResponse.p2_character || 'P2'}. ` +
              `Situation: ${event.description}. ` +
              `Advice: ${event.coach_advice}.`;

            const embedding = await this.aiService.generateEmbedding(contextText);

            await this.vectorRepository.createScenario({
              scenario_id: UuidHelper.generate(),
              game_id: request.game_id || 'unknown',
              description: event.description,
              context: contextText,
              characters_involved: [analysisResponse.p1_character, analysisResponse.p2_character].filter(Boolean) as string[],
              embedding,
              match_references: [analysisId],
              tags: [event.event_type]
            });
          } catch (e) {
            console.error('[AnalysisService] Failed to save scenario to vector DB:', e);
            // Don't fail the main request if vector save fails
          }
        }
      }

      // Add analysis_id to response
      const responseWithId: AnalysisResponse = {
        ...analysisResponse,
        analysis_id: analysisId,
      };

      return {
        success: true,
        data: responseWithId,
        message: 'Analysis completed successfully',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResponse>> {
    try {
      const analysis = await this.analysisRepository.findByAnalysisId(analysisId);

      if (!analysis) {
        return {
          success: false,
          error: 'Analysis not found',
        };
      }

      return {
        success: true,
        data: analysis.analysis as AnalysisResponse,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get recent analyses
   */
  async getRecentAnalyses(limit: number = 10): Promise<ApiResponse<AnalysisResponse[]>> {
    try {
      const analyses = await this.analysisRepository.getRecentAnalyses(limit);

      const mappedAnalyses = analyses.map(a => a.analysis as AnalysisResponse);

      return {
        success: true,
        data: mappedAnalyses,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check cache for existing analysis
   */
  private async getCachedAnalysis(request: AnalysisRequest) {
    if (request.youtube_url) {
      return await this.analysisRepository.findByYouTubeUrl(request.youtube_url);
    } else if (request.video_path) {
      return await this.analysisRepository.findByVideoPath(request.video_path);
    }
    return null;
  }

  /**
   * Validate analysis request
   */
  private validateAnalysisRequest(request: AnalysisRequest): void {
    if (!request.youtube_url && !request.video_path) {
      throw new Error('Either youtube_url or video_path must be provided');
    }

    if (request.youtube_url && request.video_path) {
      throw new Error('Cannot provide both youtube_url and video_path');
    }
  }

  /**
   * Enrich analysis request with game metadata and character rules
   * Fetches GameMetadata and CharacterEncyclopedia game_rules if game_id is provided
   */
  private async enrichRequestWithGameContext(
    request: AnalysisRequest
  ): Promise<AnalysisRequest> {
    // If game_id is not provided, return request as-is
    if (!request.game_id) {
      return request;
    }

    const enrichedRequest: AnalysisRequest = { ...request };

    try {
      // Fetch game metadata (global mechanics and constants)
      const gameMetadataResult = await this.gameMetadataService.getCurrentGameMetadataByGameId(
        request.game_id
      );

      let gameMetadata: IGameMetadata | null = null;
      if (gameMetadataResult.success && gameMetadataResult.data) {
        gameMetadata = gameMetadataResult.data;
        enrichedRequest.game_metadata = {
          global_mechanics: gameMetadata.global_mechanics || [],
          constants: gameMetadata.constants || {},
        };
      } else {
        console.warn(
          `[AnalysisService] Game metadata not found for gameId: ${request.game_id}. Proceeding without metadata.`
        );
      }

      // Fetch character encyclopedia data (movesets + rules) if character IDs are provided
      let p1CharacterData: CharacterAnalysisData | null = null;
      let p2CharacterData: CharacterAnalysisData | null = null;
      let p1Rules: CharacterGameRule[] | null = null;
      let p2Rules: CharacterGameRule[] | null = null;

      if (request.p1_character_id || request.p2_character_id) {
        enrichedRequest.character_game_rules = {};

        // Fetch P1 character encyclopedia (full moveset + rules)
        if (request.p1_character_id) {
          const p1EncyclopediaResult = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(
            request.game_id,
            request.p1_character_id
          );

          if (p1EncyclopediaResult.success && p1EncyclopediaResult.data) {
            const p1Encyclopedia = p1EncyclopediaResult.data;

            // Try to get character name from Character model
            // Note: character_id in CharacterEncyclopedia typically matches name in Character model
            let p1CharacterName = p1Encyclopedia.character_id;
            if (this.characterService) {
              try {
                // Try to get character by name (character_id often matches name)
                const characterResult = await this.characterService.getCurrentCharacterByGameAndName(
                  request.game_id,
                  request.p1_character_id
                );
                if (characterResult.success && characterResult.data) {
                  p1CharacterName = characterResult.data.name || p1CharacterName;
                }
              } catch (error) {
                // Silently fail - use character_id as fallback
                console.debug(`[AnalysisService] Could not fetch character name for ${request.p1_character_id}`);
              }
            }

            p1CharacterData = {
              character_id: p1Encyclopedia.character_id,
              character_name: p1CharacterName,
              moveset: p1Encyclopedia.moveset,
              game_rules: p1Encyclopedia.game_rules,
            };
            p1Rules = p1Encyclopedia.game_rules || [];
            enrichedRequest.character_game_rules.p1 = p1Rules;
          } else {
            // Fallback: try to get just game rules if full encyclopedia not available
            const p1RulesResult = await this.characterEncyclopediaService.getGameRules(
              request.game_id,
              request.p1_character_id
            );
            if (p1RulesResult.success && p1RulesResult.data) {
              p1Rules = p1RulesResult.data;
              enrichedRequest.character_game_rules.p1 = p1Rules;
            } else {
              console.warn(
                `[AnalysisService] Character encyclopedia not found for gameId: ${request.game_id}, characterId: ${request.p1_character_id}. Proceeding without P1 data.`
              );
            }
          }
        }

        // Fetch P2 character encyclopedia (full moveset + rules)
        if (request.p2_character_id) {
          const p2EncyclopediaResult = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(
            request.game_id,
            request.p2_character_id
          );

          if (p2EncyclopediaResult.success && p2EncyclopediaResult.data) {
            const p2Encyclopedia = p2EncyclopediaResult.data;

            // Try to get character name from Character model
            // Note: character_id in CharacterEncyclopedia typically matches name in Character model
            let p2CharacterName = p2Encyclopedia.character_id;
            if (this.characterService) {
              try {
                // Try to get character by name (character_id often matches name)
                const characterResult = await this.characterService.getCurrentCharacterByGameAndName(
                  request.game_id,
                  request.p2_character_id
                );
                if (characterResult.success && characterResult.data) {
                  p2CharacterName = characterResult.data.name || p2CharacterName;
                }
              } catch (error) {
                // Silently fail - use character_id as fallback
                console.debug(`[AnalysisService] Could not fetch character name for ${request.p2_character_id}`);
              }
            }

            p2CharacterData = {
              character_id: p2Encyclopedia.character_id,
              character_name: p2CharacterName,
              moveset: p2Encyclopedia.moveset,
              game_rules: p2Encyclopedia.game_rules,
            };
            p2Rules = p2Encyclopedia.game_rules || [];
            enrichedRequest.character_game_rules.p2 = p2Rules;
          } else {
            // Fallback: try to get just game rules if full encyclopedia not available
            const p2RulesResult = await this.characterEncyclopediaService.getGameRules(
              request.game_id,
              request.p2_character_id
            );
            if (p2RulesResult.success && p2RulesResult.data) {
              p2Rules = p2RulesResult.data;
              enrichedRequest.character_game_rules.p2 = p2Rules;
            } else {
              console.warn(
                `[AnalysisService] Character encyclopedia not found for gameId: ${request.game_id}, characterId: ${request.p2_character_id}. Proceeding without P2 data.`
              );
            }
          }
        }
      }

      // Create enhanced "Cheat Sheet" using AiPromptHelper (includes movesets)
      const aiContext = AiPromptHelper.formatFullAnalysisContext(
        gameMetadata,
        p1CharacterData,
        p2CharacterData
      );

      if (aiContext) {
        // Store enhanced context as ai_context (new format with movesets)
        enrichedRequest.ai_context = aiContext;
        console.log(`[AnalysisService] Generated AI context (${aiContext.length} chars) with movesets`);
      }

      // Also add legacy formatted context for backward compatibility
      const formattedContext = formatFullGameContextForAI(gameMetadata, p1Rules, p2Rules);
      if (formattedContext) {
        enrichedRequest.game_context_text = formattedContext;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[AnalysisService] Failed to enrich request with game context:`, errorMessage);
      // Continue with original request if enrichment fails
      return request;
    }

    return enrichedRequest;
  }
}

