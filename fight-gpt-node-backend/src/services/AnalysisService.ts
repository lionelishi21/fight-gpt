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
import { NotificationService } from './NotificationService';
import { Game } from '../models/Game';

export interface IAnalysisService {
  analyzeVideo(request: AnalysisRequest, userId?: string): Promise<ApiResponse<AnalysisResponse>>;
  getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResponse>>;
  getRecentAnalyses(limit: number, userId?: string, gameId?: string): Promise<ApiResponse<any[]>>;
  getDiscoveryAnalyses(limit?: number, gameId?: string, p1Char?: string, p2Char?: string): Promise<ApiResponse<any[]>>;
  trackDiscoveryView(analysisIds: string[]): Promise<ApiResponse<void>>;
  trackDiscoveryClick(analysisId: string): Promise<ApiResponse<void>>;
  getUserDiscoveryViews(userId: string): Promise<ApiResponse<string[]>>;
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
    private readonly notificationService?: NotificationService,
    private readonly rivalRepository?: IRivalRepository
  ) {
    super();
  }

  private sanitizeAiString(val: any): string | null {
    if (!val || typeof val !== 'string') return null;
    const low = val.toLowerCase().trim();
    if (low === 'undefined' || low === 'null' || low === 'unknown' || low === 'p1' || low === 'p2') return null;
    return low.replace(/\s+/g, '_');
  }

  async analyzeVideo(request: AnalysisRequest, userId?: string): Promise<ApiResponse<AnalysisResponse>> {
    try {
      this.validateAnalysisRequest(request);

      // --- USER & AUTH CHECK ---
      const user = userId ? await User.findById(userId) : null;
      const isAdmin = user?.role === 'admin';

      if (user && !isAdmin) {
        const tier = (user.tier || 'FREE').toUpperCase();
        const recentCount = await this.analysisRepository.countRecentAnalysesByUser(userId as string, 24);
        
        const maxFree = 1;
        const maxCompetitor = 10;
        
        if (tier === 'FREE' && recentCount >= maxFree) {
          return { success: false, error: 'FREE_TIER_LIMIT: You have used your 1 daily AI scan. Upgrade to Pro for unlimited analysis.' };
        }
        if (tier === 'COMPETITOR' && recentCount >= maxCompetitor) {
          return { success: false, error: 'LIMIT_REACHED: You have reached your 10 daily scans limit.' };
        }
      }

      // Bypass cache only if forced re-analysis is requested AND user is admin
      const shouldForce = request.force && isAdmin;
      const cachedAnalysis = shouldForce ? null : await this.getCachedAnalysis(request);
      if (cachedAnalysis) {
        // If this authenticated user doesn't have their own record for this analysis,
        // save one so it appears on their dashboard. Silently ignores errors.
        if (userId && cachedAnalysis.user_id !== userId) {
          const analysisId = UuidHelper.generate();
          this.analysisRepository
            .createAnalysis(request, cachedAnalysis.analysis as AnalysisResponse, analysisId, userId)
            .catch(() => {});
        }
        return {
          success: true,
          data: { ...(cachedAnalysis.analysis as AnalysisResponse), analysis_id: cachedAnalysis.analysis_id },
          message: 'Analysis retrieved from cache',
        };
      }

      const enrichedRequest = await this.enrichRequestWithGameContext(request);
      const analysisResponse = await this.aiService.analyzeVideo(enrichedRequest);
      const analysisId = UuidHelper.generate();

      await this.analysisRepository.createAnalysis(request, analysisResponse, analysisId, userId);

      // --- VECTOR STORAGE & INTELLIGENCE LOOP ---
      try {
        await this.processVectorIntelligence(analysisId, request, analysisResponse);
      } catch (e) {
        console.error('[AnalysisService] Vector processing failed:', e);
      }

      // RIVAL_WATCH Alert
      if (this.notificationService && this.rivalRepository) {
          const names = [analysisResponse.p1_name, analysisResponse.p2_name].filter(Boolean) as string[];
          const game = await Game.findOne({ game_id: request.game_id }).select('name').lean().exec();
          const gameName = (game as any)?.name || request.game_id || 'Unknown Game';

          for (const name of names) {
              const rivals = await this.rivalRepository.findByTargetName(name, request.game_id || 'unknown');
              for (const rival of rivals) {
                  await this.notificationService.rivalWatch(rival.userId.toString(), {
                      gameId: request.game_id || 'unknown',
                      gameName,
                      rivalName: name,
                      analysisId,
                  });
              }
          }
      }

      // PRO_SCOUT Alert
      if (this.notificationService) {
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
                      await this.notificationService.proScout(user._id.toString(), {
                          gameId: request.game_id || 'unknown',
                          proName: name,
                          analysisId,
                          characterId: (analysisResponse.p1_name?.toLowerCase() === name.toLowerCase()) 
                              ? analysisResponse.p1_character 
                              : analysisResponse.p2_character,
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


  async getAnalysis(analysisId: string): Promise<ApiResponse<any>> {
    try {
      const analysis = await this.analysisRepository.findByAnalysisId(analysisId);
      if (!analysis) return { success: false, error: 'Analysis not found' };
      // Return document-level fields alongside the AI analysis so the frontend
      // has youtube_url, game_id, analysis_id etc. for video playback and linking.
      return {
        success: true,
        data: {
          _id: analysis._id,
          analysis_id: analysis.analysis_id,
          youtube_url: analysis.youtube_url,
          video_path: analysis.video_path,
          game_id: analysis.game_id,
          created_at: analysis.created_at,
          ...(analysis.analysis || {}),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRecentAnalyses(limit: number = 10, userId?: string, gameId?: string): Promise<ApiResponse<any[]>> {
    try {
      const analyses = await this.analysisRepository.getRecentAnalyses(limit, userId, gameId);
      return {
        success: true,
        data: analyses.map(a => ({
          _id: a._id,
          analysis_id: a.analysis_id,
          youtube_url: a.youtube_url,
          game_id: a.game_id,
          created_at: a.created_at,
          ...(a.analysis || {} as object),
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDiscoveryAnalyses(
    limit: number = 20, 
    gameId?: string,
    p1Char?: string,
    p2Char?: string
  ): Promise<ApiResponse<any[]>> {
    try {
      const analyses = await this.analysisRepository.getDiscoveryAnalyses(limit, gameId, p1Char, p2Char);
      return {
        success: true,
        data: analyses.map(a => ({
          _id: a._id,
          analysis_id: a.analysis_id,
          youtube_url: a.youtube_url,
          game_id: a.game_id,
          view_count: a.view_count || 0,
          click_count: a.click_count || 0,
          created_at: a.created_at,
          ...(a.analysis || {} as object),
        })),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async trackDiscoveryView(analysisIds: string[]): Promise<ApiResponse<void>> {
    try {
      for (const id of analysisIds) {
        await this.analysisRepository.incrementViewCount(id);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to track views' };
    }
  }

  async trackDiscoveryClick(analysisId: string): Promise<ApiResponse<void>> {
    try {
      await this.analysisRepository.incrementClickCount(analysisId);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to track click' };
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
      const gameMetadata = gameMetadataResult.success ? gameMetadataResult.data : null;

      let p1Rules = null;
      let p2Rules = null;
      let p1Enc = null;
      let p2Enc = null;

      if (request.p1_character_id) {
        const rulesRes = await this.characterEncyclopediaService.getGameRules(request.game_id, request.p1_character_id);
        if (rulesRes.success) p1Rules = rulesRes.data;
        
        const encRes = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(request.game_id, request.p1_character_id);
        if (encRes.success) p1Enc = encRes.data;
      }

      if (request.p2_character_id) {
        const rulesRes = await this.characterEncyclopediaService.getGameRules(request.game_id, request.p2_character_id);
        if (rulesRes.success) p2Rules = rulesRes.data;

        const encRes = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(request.game_id, request.p2_character_id);
        if (encRes.success) p2Enc = encRes.data;
      }

      // Generate the unified "Sensei Context"
      enrichedRequest.ai_context = formatFullGameContextForAI(
        gameMetadata || null,
        p1Rules,
        p2Rules,
        p1Enc,
        p2Enc
      );

    } catch (e) {
      console.error(`[AnalysisService] Enrichment failed:`, e);
    }
    return enrichedRequest;
  }

  /**
   * Processes the timeline events from an analysis and stores them in the vector database
   * if they are novel, or links them to existing scenarios if they are similar.
   */
  public async processVectorIntelligence(analysisId: string, request: AnalysisRequest, analysisResponse: AnalysisResponse): Promise<void> {
    if (!this.vectorRepository || !analysisResponse.timeline) return;

    for (const event of analysisResponse.timeline) {
      try {
        const p1 = this.sanitizeAiString(analysisResponse.p1_character) || 'P1';
        const p2 = this.sanitizeAiString(analysisResponse.p2_character) || 'P2';
        const contextParts = [
          `Game: ${request.game_id || 'Unknown'}.`,
          `Matchup: ${p1} vs ${p2}.`,
          `Situation: ${event.description}.`,
          `Advice: ${event.coach_advice}.`,
        ];
        if (event.neutral_state)   contextParts.push(`Phase: ${event.neutral_state}.`);
        if (event.turn_owner)      contextParts.push(`Turn: ${event.turn_owner}.`);
        if (event.spacing)         contextParts.push(`Spacing: ${event.spacing}.`);
        if (event.frame_advantage) contextParts.push(`Frame advantage: ${event.frame_advantage}.`);
        if (event.p1_state)        contextParts.push(`${analysisResponse.p1_character || 'P1'} state: ${event.p1_state}.`);
        if (event.p2_state)        contextParts.push(`${analysisResponse.p2_character || 'P2'} state: ${event.p2_state}.`);

        const contextText = contextParts.join(' ');
        const embedding = await this.aiService.generateEmbedding(contextText);

        // NOVELTY CHECK
        const similarScenarios = await this.vectorRepository.findSimilarScenarios(
          embedding,
          request.game_id || 'unknown',
          1
        );

        let isNovel = true;
        let topScore = 0;

        if (similarScenarios && similarScenarios.length > 0) {
          topScore = (similarScenarios[0] as any).score || 0;
          // Threshold increased to 0.85 for better variety
          if (topScore > 0.85) isNovel = false;
          
          console.log(`[VectorIntelligence] Situation: ${event.description.slice(0, 30)}... Score: ${topScore.toFixed(4)} -> Novel: ${isNovel}`);
        } else {
          console.log(`[VectorIntelligence] No similar scenarios found. Situation is unique.`);
        }

        // Save scenario ONLY IF NOVEL to avoid duplicates
        const scenarioId = UuidHelper.generate();
        if (isNovel) {
          await this.vectorRepository.createScenario({
            scenario_id: scenarioId,
            game_id: request.game_id || 'unknown',
            pro_player_id: (request as any).pro_player_id,
            description: event.description,
            context: contextText,
            characters_involved: [
              this.sanitizeAiString(analysisResponse.p1_character),
              this.sanitizeAiString(analysisResponse.p2_character)
            ].filter(Boolean) as string[],
            embedding,
            match_references: [analysisId],
            tags: [event.event_type],
            turn_owner: event.turn_owner,
            neutral_state: event.neutral_state,
            spacing: event.spacing,
            frame_advantage: event.frame_advantage,
            p1_state: event.p1_state,
            p2_state: event.p2_state,
            timestamp: event.timestamp ? Number(event.timestamp) : undefined,
          });
          
          // TECH_DISCOVERY Alert — only for genuinely novel scenarios
          if (this.notificationService) {
            const chars = [
              this.sanitizeAiString(analysisResponse.p1_character),
              this.sanitizeAiString(analysisResponse.p2_character)
            ].filter(Boolean) as string[];
            const charLabel = chars.length > 0
              ? chars.map(c => c.toUpperCase()).join(' & ')
              : (request.game_id || 'UNKNOWN').toUpperCase();
            const shortCtx = contextText.length > 120
              ? contextText.slice(0, 117) + '…'
              : contextText;

            const usersToNotify = await User.find({
              'slots.gameId': request.game_id,
              'slots.notificationsEnabled': true
            }).limit(100);

            for (const user of usersToNotify) {
              await this.notificationService.notify((user as any)._id, 'TECH_DISCOVERY', {
                  gameId: request.game_id || 'unknown',
                  characterId: this.sanitizeAiString(analysisResponse.p1_character) || undefined,
                  title: `[${charLabel}] New tech — ${(event.event_type || 'Discovery').replace(/_/g, ' ')}`,
                  description: shortCtx,
                  link: `/dashboard/tech/${scenarioId}`,
              });
            }
          }
        } else if (similarScenarios && similarScenarios.length > 0) {
          // If not novel, link this match to the existing scenario
          const existingScenario = similarScenarios[0] as any;
          await (this.vectorRepository as any).addMatchReference(existingScenario.scenario_id, analysisId);
        }
      } catch (e) {
        console.error(`[VectorIntelligence] Failed for event:`, e);
      }
    }
  }
}
