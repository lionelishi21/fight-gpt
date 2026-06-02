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
import TrainingService from './TrainingService';
import { Analysis } from '../models/Analysis';
import { AnalysisCorrection } from '../models/AnalysisCorrection';

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
    private readonly rivalRepository?: IRivalRepository,
    private readonly premiumAiService?: IAiService,
  ) {
    super();
  }

  private sanitizeAiString(val: any): string | null {
    if (!val || typeof val !== 'string') return null;
    const low = val.toLowerCase().trim();
    if (low === 'undefined' || low === 'null' || low === 'unknown' || low === 'p1' || low === 'p2') return null;
    // Reject file paths and URLs that Gemini sometimes returns instead of character names
    if (low.includes('/') || low.includes('\\') || low.includes('http') || /\.(mp4|mov|webm|avi|mkv|jpg|png)/.test(low)) return null;
    return low.replace(/\s+/g, '_');
  }

  async analyzeVideo(request: AnalysisRequest, userId?: string): Promise<ApiResponse<AnalysisResponse>> {
    try {
      this.validateAnalysisRequest(request);

      // --- USER & AUTH CHECK ---
      const user = userId ? await User.findById(userId) : null;
      const isAdmin = user?.role === 'admin';
      const isUserUpload = !!userId; // true = paid user upload → use premium model

      if (user && !isAdmin) {
        const tier = (user.tier || 'FREE').toUpperCase();

        // Monthly rolling limits (30-day window)
        const monthlyCount = await this.analysisRepository.countRecentAnalysesByUser(userId as string, 30 * 24);

        const LIMITS: Record<string, number> = {
          FREE:       3,    // lifetime cap (3 analyses ever on free)
          COMPETITOR: 30,   // 30 per rolling 30 days
          PRO:        150,  // 150 per rolling 30 days
          COMPETITOR_ANNUAL: 30,
          PRO_ANNUAL: 150,
        };

        const limit = LIMITS[tier] ?? 3;
        if (monthlyCount >= limit) {
          const upgradeMsg = tier === 'FREE'
            ? 'FREE_TIER_LIMIT: You have used your 3 free analyses. Upgrade to Competitor ($25/mo) for 30 analyses per month.'
            : `LIMIT_REACHED: You have used ${monthlyCount}/${limit} analyses this month. Upgrade to unlock more.`;
          return { success: false, error: upgradeMsg };
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

      // --- FEW-SHOT VECTOR INJECTION ---
      // Retrieve similar verified scenarios from the vector DB as ground-truth examples.
      try {
        const fewShotExamples = await this.buildFewShotContext(enrichedRequest);
        if (fewShotExamples) {
          enrichedRequest.ai_context = (enrichedRequest.ai_context || '') + fewShotExamples;
        }
      } catch (e) {
        console.warn('[AnalysisService] Few-shot injection failed:', e instanceof Error ? e.message : e);
      }

      // --- HUMAN CORRECTION INJECTION ---
      // Inject past mistakes flagged by human coaches so the AI does not repeat them.
      try {
        const corrections = await this.buildCorrectionContext(enrichedRequest.game_id);
        if (corrections) {
          enrichedRequest.ai_context = (enrichedRequest.ai_context || '') + corrections;
        }
      } catch (e) {
        console.warn('[AnalysisService] Correction injection failed:', e instanceof Error ? e.message : e);
      }

      let analysisResponse: AnalysisResponse;
      try {
        // User uploads get Gemini 2.5 Pro; background ingestion gets Flash
        const activeService = (isUserUpload && this.premiumAiService) ? this.premiumAiService : this.aiService;
        analysisResponse = await activeService.analyzeVideo(enrichedRequest);
      } catch (e: any) {
        if (e.name === 'NotGameplayError') {
          return { success: false, error: `NOT_GAMEPLAY: ${e.reason || 'Video does not contain fighting game gameplay. Only match footage is supported.'}` };
        }
        throw e;
      }

      const analysisId = UuidHelper.generate();

      // --- MOVE NAME VALIDATION ---
      // Cross-check timeline move names against the CharacterEncyclopedia.
      // If a move name cannot be found for that character, downgrade confidence
      // to 'low' so the frontend can flag it. This prevents hallucinated move names
      // (e.g. "crouching medium" being called "standing heavy") from reaching users.
      if (analysisResponse.timeline?.length && this.characterEncyclopediaService) {
        await this.validateMoveNames(analysisResponse, request.game_id || 'sf6');
      }

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

      // --- TACTICAL TRAINING ENGINE ---
      if (userId) {
          const analysisDoc = await Analysis.findOne({ analysis_id: analysisId });
          if (analysisDoc) {
              TrainingService.generateDrillsFromAnalysis(analysisDoc).catch(e => {
                  console.error('[AnalysisService] Failed to generate drills:', e);
              });
          }
      }

      // --- PUSH NOTIFICATION — analysis complete ---
      if (userId && this.notificationService) {
          const p1 = analysisResponse.p1_character || 'P1';
          const p2 = analysisResponse.p2_character || 'P2';
          const events = analysisResponse.timeline?.length ?? 0;
          this.notificationService.pushToUser(
              userId,
              'ANALYSIS_COMPLETE',
              `${p1} vs ${p2} — Analysis Ready`,
              `${events} event${events !== 1 ? 's' : ''} identified in your match.`,
              enrichedRequest.game_id || 'unknown',
              { analysisId, type: 'analysis_complete' }
          ).catch(() => {});
      }

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

  /**
   * Queries the vector DB for the 3 most similar verified scenarios and formats
   * them as few-shot coaching examples to inject into the Gemini prompt.
   * Returns null if vectorRepository is unavailable or no relevant examples exist.
   */
  private async buildFewShotContext(request: AnalysisRequest): Promise<string | null> {
    if (!this.vectorRepository || !request.game_id) return null;

    // Build a short text description of what we're about to analyze, then embed it
    const queryText = [
      request.game_id.toUpperCase(),
      request.p1_character_id ? `P1: ${request.p1_character_id}` : '',
      request.p2_character_id ? `P2: ${request.p2_character_id}` : '',
      request.video_title || '',
    ].filter(Boolean).join(' — ');

    const embedding = await this.aiService.generateEmbedding(queryText);
    if (!embedding || embedding.length === 0) return null;

    const characters = [request.p1_character_id, request.p2_character_id].filter(Boolean) as string[];
    const similar = await this.vectorRepository.findSimilarScenarios(embedding, request.game_id, 6, characters);
    if (!similar || similar.length === 0) return null;

    // Prefer current-patch or cross-patch-valid scenarios as examples.
    // Old-patch-specific scenarios (frame data that changed) are still shown
    // but ranked lower so the AI understands what's foundational vs patch-specific.
    const currentPatch = await this.gameMetadataService
      .getCurrentGameMetadataByGameId(request.game_id)
      .then(r => r.success ? r.data?.patch_version : null)
      .catch(() => null);

    const ranked = similar.sort((a: any, b: any) => {
      const aScore = (a.patch_version === currentPatch ? 2 : 0) + (a.cross_patch_valid ? 1 : 0);
      const bScore = (b.patch_version === currentPatch ? 2 : 0) + (b.cross_patch_valid ? 1 : 0);
      return bScore - aScore;
    }).slice(0, 3);

    const examples = ranked
      .filter(s => s.description)
      .map((s, i) => {
        const patchNote = (s as any).cross_patch_valid
          ? '  [CROSS-PATCH VALID — mechanic applies regardless of patch]'
          : (s as any).patch_version
            ? `  [From patch ${(s as any).patch_version} — verify if move data still applies]`
            : '';
        return [
          `EXAMPLE ${i + 1}:`,
          s.characters_involved?.length ? `  Characters: ${s.characters_involved.join(' vs ')}` : '',
          s.tags?.length ? `  Event type: ${s.tags[0]}` : '',
          s.spacing ? `  Spacing: ${s.spacing}` : '',
          s.frame_advantage ? `  Frame state: ${s.frame_advantage}` : '',
          patchNote,
          `  Verified event: ${s.description}`,
          s.context ? `  Full context: ${s.context}` : '',
        ].filter(Boolean).join('\n');
      });

    if (examples.length === 0) return null;

    return `\n\n═══ VERIFIED REFERENCE EXAMPLES FROM SIMILAR MATCHES ═══
The following events were correctly classified by human coaches. Use them as ground truth for outcome and spacing classification in this match:

${examples.join('\n\n')}

═══ END EXAMPLES ═══\n`;
  }

  /**
   * Pulls recent human corrections for this game and formats them as
   * "MISTAKES TO AVOID" injected directly before the AI analyzes the video.
   * Both pending and applied corrections are included — every flagged mistake
   * should immediately influence the next analysis, not just after review.
   */
  private async buildCorrectionContext(gameId?: string): Promise<string | null> {
    if (!gameId) return null;

    const corrections = await AnalysisCorrection.find({ game_id: gameId })
      .sort({ created_at: -1 })
      .limit(8)
      .lean() as any[];

    if (!corrections.length) return null;

    const formatted = corrections.map((c, i) => {
      const lines: string[] = [`CORRECTION ${i + 1} (${gameId.toUpperCase()}${c.p1_character ? ` — ${c.p1_character} vs ${c.p2_character || '?'}` : ''}):`];

      // What the AI said (wrong)
      const wrongParts: string[] = [];
      if (c.original_event_type) wrongParts.push(`event_type="${c.original_event_type}"`);
      if (c.original_move_used)  wrongParts.push(`move="${c.original_move_used}"`);
      if (c.original_outcome)    wrongParts.push(`outcome="${c.original_outcome}"`);
      lines.push(`  ❌ AI SAID: ${wrongParts.join(', ')}`);
      if (c.original_description) lines.push(`     Description: "${c.original_description}"`);

      // What is actually correct
      lines.push(`  ✓ HUMAN CORRECTION: ${c.correction}`);
      if (c.corrected_event_type) lines.push(`  ✓ Correct event_type: ${c.corrected_event_type}`);
      if (c.corrected_move_used)  lines.push(`  ✓ Correct move: ${c.corrected_move_used}`);
      if (c.corrected_outcome)    lines.push(`  ✓ Correct outcome: ${c.corrected_outcome}`);

      return lines.join('\n');
    });

    return `\n\n═══ HUMAN COACH CORRECTIONS — DO NOT REPEAT THESE MISTAKES ═══
A human expert reviewed previous AI analyses of ${gameId.toUpperCase()} matches and flagged the following errors.
Study each one carefully. Apply the correction logic to similar situations in this video.

${formatted.join('\n\n')}

KEY LESSON: If you see a situation that resembles any correction above, apply the corrected logic, not the original mistaken logic.
═══ END CORRECTIONS ═══\n`;
  }

  /**
   * Cross-checks every move_used in the timeline against the CharacterEncyclopedia.
   * If a move name can't be found for that character, confidence is set to 'low'
   * and a note is appended to the description so the user knows it's uncertain.
   * This catches hallucinated move names without blocking the analysis.
   */
  private async validateMoveNames(response: AnalysisResponse, gameId: string): Promise<void> {
    if (!response.timeline) return;

    const charCache: Record<string, Set<string>> = {};

    const getKnownMoves = async (charName: string): Promise<Set<string>> => {
      const key = `${gameId}:${charName}`.toLowerCase();
      if (charCache[key]) return charCache[key];
      try {
        const encRes = await this.characterEncyclopediaService.getEncyclopediaByGameAndCharacter(gameId, charName.toLowerCase().replace(/\s+/g, '_'));
        const enc = encRes.success ? encRes.data : null;
        const names = new Set<string>();
        if (enc?.moveset) {
          const all = [
            ...(enc.moveset.normals || []),
            ...(enc.moveset.specials || []),
            ...(enc.moveset.supers || []),
            ...(enc.moveset.throws || []),
          ];
          all.forEach(m => {
            names.add(m.name.toLowerCase());
            // Also add common shorthand variations
            names.add(m.name.toLowerCase().replace(/\s+/g, ''));
          });
        }
        charCache[key] = names;
        return names;
      } catch {
        charCache[key] = new Set();
        return new Set();
      }
    };

    for (const event of response.timeline) {
      if (!event.move_used || event.move_confidence === 'low') continue;
      // Skip generic descriptors — they're intentionally vague
      const genericTerms = ['a heavy', 'a medium', 'a light', 'a low', 'a special', 'a normal', 'a move', 'unknown'];
      if (genericTerms.some(t => event.move_used!.toLowerCase().startsWith(t))) continue;

      // Determine which character used the move
      const charName = event.actor === 'p2' ? response.p2_character : response.p1_character;
      if (!charName) continue;

      const knownMoves = await getKnownMoves(charName);
      if (knownMoves.size === 0) continue; // No encyclopedia data for this character

      const moveLower = event.move_used.toLowerCase().replace(/\s+/g, '');
      const found = [...knownMoves].some(m => m.replace(/\s+/g, '') === moveLower || m.includes(moveLower) || moveLower.includes(m));

      if (!found) {
        event.move_confidence = 'low';
        event.description = `[Move name uncertain — "${event.move_used}" not found in ${charName}'s known moveset] ${event.description}`;
      }
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
    if (!this.vectorRepository) {
      console.warn('[VectorIntelligence] Skipping: Vector repository not initialized');
      return;
    }
    if (!analysisResponse.timeline) {
      console.warn('[VectorIntelligence] Skipping: No timeline in analysis response');
      return;
    }

    console.log(`[VectorIntelligence] Processing ${analysisResponse.timeline.length} events for analysis ${analysisId}`);

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
          
          console.log(`[VectorIntelligence] Event: ${event.description.slice(0, 30)}... Score: ${topScore.toFixed(4)} -> Novel: ${isNovel}`);
        } else {
          console.log(`[VectorIntelligence] No similar scenarios found (treated as unique).`);
        }

        // Save scenario ONLY IF NOVEL to avoid duplicates
        const scenarioId = UuidHelper.generate();
        if (isNovel) {
          // Determine patch version from game metadata
          let patchVersion: string | undefined;
          try {
            const meta = await this.gameMetadataService.getCurrentGameMetadataByGameId(request.game_id || '');
            patchVersion = meta.success ? meta.data?.patch_version : undefined;
          } catch {}

          // Cross-patch validity: events that describe fundamental mechanics
          // (spacing, wakeup, neutral positioning, anti-air timing) survive patch updates.
          // Frame-specific data (move frame advantage, damage) may become stale.
          const crossPatchEventTypes = ['neutral_loss', 'neutral_win', 'anti_air', 'evasion', 'spacing_error', 'bad_habit'];
          const isCrossPatchValid = crossPatchEventTypes.includes(event.event_type) &&
            event.move_outcome !== 'counter_hit'; // CH damage/hitstun changes per patch

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
            timestamp: this.parseTimestamp(event.timestamp),
            patch_version: patchVersion,
            cross_patch_valid: isCrossPatchValid,
          });
          
          console.log(`[VectorIntelligence] Created new scenario: ${scenarioId}`);
          
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

  async getUserDiscoveryViews(userId: string): Promise<ApiResponse<string[]>> {
    try {
      // Placeholder for now to satisfy the interface and fix the build.
      // Actual implementation would query a view tracking table.
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch views' };
    }
  }

  /**
   * Parse timestamp string (MM:SS or HH:MM:SS) into total seconds
   */
  private parseTimestamp(ts: string | number | undefined): number | undefined {
    if (ts === undefined || ts === null) return undefined;
    if (typeof ts === 'number') return isNaN(ts) ? undefined : ts;
    
    try {
      const parts = ts.toString().split(':').map(Number);
      if (parts.some(isNaN)) return undefined;
      
      if (parts.length === 3) {
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
      } else if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
      } else if (parts.length === 1) {
        return parts[0];
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
