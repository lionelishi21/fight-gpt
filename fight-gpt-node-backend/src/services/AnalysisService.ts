import { AnalysisRequest, AnalysisResponse, ApiResponse, TimelineEvent } from '../types';
import User from '../models/User';
import { ProPlayer } from '../models/ProPlayer';
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
import { INotificationRepository } from '../repositories/NotificationRepository';
import { IRivalRepository } from '../repositories/RivalRepository';

/**
 * Analysis Service interface
 */
export interface IAnalysisService {
  analyzeVideo(request: AnalysisRequest): Promise<ApiResponse<AnalysisResponse>>;
  getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResponse>>;
  getRecentAnalyses(limit: number): Promise<ApiResponse<AnalysisResponse[]>>;
}

/**
 * Analysis Service implementation
 */
export class AnalysisService extends BaseService implements IAnalysisService {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly aiService: IAiService,
    private readonly gameMetadataService: IGameMetadataService,
    private readonly characterEncyclopediaService: ICharacterEncyclopediaService,
    private readonly characterService?: ICharacterService,
    private readonly vectorRepository?: IVectorRepository,
    private readonly notificationRepository?: INotificationRepository,
    private readonly rivalRepository?: IRivalRepository
  ) {
    super();
  }

  async analyzeVideo(request: AnalysisRequest): Promise<ApiResponse<AnalysisResponse>> {
    try {
      this.validateAnalysisRequest(request);

      const cachedAnalysis = await this.getCachedAnalysis(request);
      if (cachedAnalysis) {
        return {
          success: true,
          data: cachedAnalysis.analysis as AnalysisResponse,
          message: 'Analysis retrieved from cache',
        };
      }

      const enrichedRequest = await this.enrichRequestWithGameContext(request);
      const analysisResponse = await this.aiService.analyzeVideo(enrichedRequest);
      const analysisId = UuidHelper.generate();

      await this.analysisRepository.createAnalysis(request, analysisResponse, analysisId);

      // --- VECTOR STORAGE & INTELLIGENCE LOOP ---
      if (this.vectorRepository && analysisResponse.timeline) {
        for (const event of analysisResponse.timeline) {
          try {
            const contextText = `Game: ${request.game_id || 'Unknown'}. ` +
              `Matchup: ${analysisResponse.p1_character || 'P1'} vs ${analysisResponse.p2_character || 'P2'}. ` +
              `Situation: ${event.description}. ` +
              `Advice: ${event.coach_advice}.`;

            const embedding = await this.aiService.generateEmbedding(contextText);

            // NOVELTY CHECK
            const similarScenarios = await this.vectorRepository.findSimilarScenarios(
              embedding,
              request.game_id || 'unknown',
              1
            );

            let isNovel = true;
            if (similarScenarios && similarScenarios.length > 0) {
              const topScore = (similarScenarios[0] as any).score || 1;
              if (topScore > 0.15) isNovel = false;
            }

            // Save scenario
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

            // TECH_DISCOVERY Alert
            if (isNovel && this.notificationRepository) {
              const usersToNotify = await User.find({
                'slots.gameId': request.game_id,
                'slots.notificationsEnabled': true
              }).limit(100);

              for (const user of usersToNotify) {
                  await this.notificationRepository.createNotification({
                      userId: (user as any)._id,
                      type: 'TECH_DISCOVERY',
                      severity: 'high',
                      payload: {
                          gameId: request.game_id || 'unknown',
                          characterId: analysisResponse.p1_character || undefined,
                          title: 'NEW TECH DISCOVERED',
                          description: `A unique interaction was spotted for ${analysisResponse.p1_character || 'your character'}.`,
                          link: request.youtube_url ? `${request.youtube_url}&t=${event.timestamp}` : undefined,
                          timestamp: event.timestamp,
                          data: { novelty_score: 1 - ((similarScenarios[0] as any)?.score || 0) }
                      }
                  });
              }
            }
          } catch (e) {
            console.error('[AnalysisService] Vector processing failed:', e);
          }
        }
      }

      // RIVAL_WATCH Alert
      if (this.notificationRepository && this.rivalRepository) {
          const names = [analysisResponse.p1_name, analysisResponse.p2_name].filter(Boolean) as string[];
          for (const name of names) {
              const rivals = await this.rivalRepository.findByTargetName(name, request.game_id || 'unknown');
              for (const rival of rivals) {
                  await this.notificationRepository.createNotification({
                      userId: rival.userId as any,
                      type: 'RIVAL_WATCH',
                      severity: 'high',
                      payload: {
                          gameId: request.game_id || 'unknown',
                          title: `RIVAL SPOTTED: ${name}`,
                          description: `Your tracked rival ${name} was found in a new match.`,
                          link: request.youtube_url || undefined,
                          data: { rivalName: name, analysisId }
                      }
                  });
              }
          }
      }

      // PRO_SCOUT Alert
      if (this.notificationRepository) {
          const names = [analysisResponse.p1_name, analysisResponse.p2_name].filter(Boolean) as string[];
          for (const name of names) {
              const pro = await ProPlayer.findOne({ 
                  name: { $regex: new RegExp(`^${name}$`, 'i') }, 
                  gameId: request.game_id || 'unknown',
                  isVerified: true 
              }).exec();
              
              if (pro) {
                  const usersToNotify = await User.find({
                      'slots.gameId': request.game_id,
                      $or: [
                          { 'slots.characterId': analysisResponse.p1_character },
                          { 'slots.characterId': analysisResponse.p2_character }
                      ],
                      'slots.notificationsEnabled': true
                  }).limit(100);

                  for (const user of usersToNotify) {
                      await this.notificationRepository.createNotification({
                          userId: (user as any)._id,
                          type: 'PRO_SCOUT',
                          severity: 'medium',
                          payload: {
                              gameId: request.game_id || 'unknown',
                              characterId: (analysisResponse.p1_name?.toLowerCase() === name.toLowerCase()) 
                                  ? analysisResponse.p1_character 
                                  : analysisResponse.p2_character,
                              title: `PRO SCOUT: ${name}`,
                              description: `New high-level footage analyzed for ${name}.`,
                              link: request.youtube_url || undefined,
                              data: { proName: name, analysisId }
                          }
                      });
                  }
              }
          }
      }

      const responseWithId: AnalysisResponse = {
        ...analysisResponse,
        analysis_id: analysisId,
      };

      return { success: true, data: responseWithId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResponse>> {
    try {
      const analysis = await this.analysisRepository.findByAnalysisId(analysisId);
      if (!analysis) return { success: false, error: 'Analysis not found' };
      return { success: true, data: analysis.analysis as AnalysisResponse };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRecentAnalyses(limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      const analyses = await this.analysisRepository.getRecentAnalyses(limit);
      return {
        success: true,
        data: analyses.map(a => ({
          analysis_id: a.analysis_id,
          youtube_url: a.youtube_url,
          game_id: a.game_id,
          created_at: a.created_at,
          ...(a.analysis as object),
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getCachedAnalysis(request: AnalysisRequest) {
    if (request.youtube_url) return await this.analysisRepository.findByYouTubeUrl(request.youtube_url);
    if (request.video_path) return await this.analysisRepository.findByVideoPath(request.video_path);
    return null;
  }

  private validateAnalysisRequest(request: AnalysisRequest): void {
    if (!request.youtube_url && !request.video_path) throw new Error('Source required');
    if (request.youtube_url && request.video_path) throw new Error('Multiple sources');
  }

  private async enrichRequestWithGameContext(request: AnalysisRequest): Promise<AnalysisRequest> {
    if (!request.game_id) return request;
    const enrichedRequest: AnalysisRequest = { ...request };
    try {
      const gameMetadataResult = await this.gameMetadataService.getCurrentGameMetadataByGameId(request.game_id);
      if (gameMetadataResult.success && gameMetadataResult.data) {
        enrichedRequest.game_metadata = {
          global_mechanics: gameMetadataResult.data.global_mechanics || [],
          constants: gameMetadataResult.data.constants || {},
        };
      }

      if (request.p1_character_id || request.p2_character_id) {
        enrichedRequest.character_game_rules = {};
        if (request.p1_character_id) {
          const res = await this.characterEncyclopediaService.getGameRules(request.game_id, request.p1_character_id);
          if (res.success) enrichedRequest.character_game_rules.p1 = res.data;
        }
        if (request.p2_character_id) {
          const res = await this.characterEncyclopediaService.getGameRules(request.game_id, request.p2_character_id);
          if (res.success) enrichedRequest.character_game_rules.p2 = res.data;
        }
      }
    } catch (e) {
      console.error(`[AnalysisService] Enrichment failed:`, e);
    }
    return enrichedRequest;
  }
}
