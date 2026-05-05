"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const User_1 = __importDefault(require("../models/User"));
const ProPlayer_1 = require("../models/ProPlayer");
const BaseService_1 = require("./BaseService");
const uuidHelper_1 = require("../helpers/uuidHelper");
const aiContextHelper_1 = require("../helpers/aiContextHelper");
const Game_1 = require("../models/Game");
/**
 * Analysis Service implementation
 */
class AnalysisService extends BaseService_1.BaseService {
    analysisRepository;
    aiService;
    gameMetadataService;
    characterEncyclopediaService;
    characterService;
    vectorRepository;
    notificationService;
    rivalRepository;
    constructor(analysisRepository, aiService, gameMetadataService, characterEncyclopediaService, characterService, vectorRepository, notificationService, rivalRepository) {
        super();
        this.analysisRepository = analysisRepository;
        this.aiService = aiService;
        this.gameMetadataService = gameMetadataService;
        this.characterEncyclopediaService = characterEncyclopediaService;
        this.characterService = characterService;
        this.vectorRepository = vectorRepository;
        this.notificationService = notificationService;
        this.rivalRepository = rivalRepository;
    }
    sanitizeAiString(val) {
        if (!val || typeof val !== 'string')
            return null;
        const low = val.toLowerCase().trim();
        if (low === 'undefined' || low === 'null' || low === 'unknown' || low === 'p1' || low === 'p2')
            return null;
        return low.replace(/\s+/g, '_');
    }
    async analyzeVideo(request, userId) {
        try {
            this.validateAnalysisRequest(request);
            const cachedAnalysis = await this.getCachedAnalysis(request);
            if (cachedAnalysis) {
                return {
                    success: true,
                    data: cachedAnalysis.analysis,
                    message: 'Analysis retrieved from cache',
                };
            }
            const enrichedRequest = await this.enrichRequestWithGameContext(request);
            const analysisResponse = await this.aiService.analyzeVideo(enrichedRequest);
            const analysisId = uuidHelper_1.UuidHelper.generate();
            await this.analysisRepository.createAnalysis(request, analysisResponse, analysisId, userId);
            // --- VECTOR STORAGE & INTELLIGENCE LOOP ---
            try {
                await this.processVectorIntelligence(analysisId, request, analysisResponse);
            }
            catch (e) {
                console.error('[AnalysisService] Vector processing failed:', e);
            }
            // RIVAL_WATCH Alert
            if (this.notificationService && this.rivalRepository) {
                const names = [analysisResponse.p1_name, analysisResponse.p2_name].filter(Boolean);
                const game = await Game_1.Game.findOne({ game_id: request.game_id }).select('name').lean().exec();
                const gameName = game?.name || request.game_id || 'Unknown Game';
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
                const names = [analysisResponse.p1_name, analysisResponse.p2_name].filter(Boolean);
                for (const name of names) {
                    const pro = await ProPlayer_1.ProPlayer.findOne({
                        name: { $regex: new RegExp(`^${name}$`, 'i') },
                        gameId: request.game_id || 'unknown',
                        isVerified: true
                    }).exec();
                    if (pro) {
                        const usersToNotify = await User_1.default.find({
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
            const responseWithId = {
                ...analysisResponse,
                analysis_id: analysisId,
            };
            return { success: true, data: responseWithId };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async getAnalysis(analysisId) {
        try {
            const analysis = await this.analysisRepository.findByAnalysisId(analysisId);
            if (!analysis)
                return { success: false, error: 'Analysis not found' };
            return { success: true, data: analysis.analysis };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async getRecentAnalyses(limit = 10, userId, gameId) {
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
                    ...a.analysis,
                })),
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async getDiscoveryAnalyses(limit = 20) {
        try {
            const analyses = await this.analysisRepository.getRecentAnalyses(limit);
            return {
                success: true,
                data: analyses.map(a => ({
                    _id: a._id,
                    analysis_id: a.analysis_id,
                    youtube_url: a.youtube_url,
                    game_id: a.game_id,
                    created_at: a.created_at,
                    ...a.analysis,
                })),
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async getCachedAnalysis(request) {
        if (request.youtube_url)
            return await this.analysisRepository.findByYouTubeUrl(request.youtube_url);
        if (request.video_path)
            return await this.analysisRepository.findByVideoPath(request.video_path);
        return null;
    }
    validateAnalysisRequest(request) {
        if (!request.youtube_url && !request.video_path)
            throw new Error('Source required');
        if (request.youtube_url && request.video_path)
            throw new Error('Multiple sources');
    }
    async enrichRequestWithGameContext(request) {
        if (!request.game_id)
            return request;
        const enrichedRequest = { ...request };
        try {
            const gameMetadataResult = await this.gameMetadataService.getCurrentGameMetadataByGameId(request.game_id);
            const gameMetadata = gameMetadataResult.success ? gameMetadataResult.data : null;
            let p1Rules = null;
            let p2Rules = null;
            let p1Enc = null;
            let p2Enc = null;
            if (request.p1_character_id) {
                const rulesRes = await this.characterEncyclopediaService.getGameRules(request.game_id, request.p1_character_id);
                if (rulesRes.success)
                    p1Rules = rulesRes.data;
                const encRes = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(request.game_id, request.p1_character_id);
                if (encRes.success)
                    p1Enc = encRes.data;
            }
            if (request.p2_character_id) {
                const rulesRes = await this.characterEncyclopediaService.getGameRules(request.game_id, request.p2_character_id);
                if (rulesRes.success)
                    p2Rules = rulesRes.data;
                const encRes = await this.characterEncyclopediaService.getCurrentEncyclopediaByGameAndCharacter(request.game_id, request.p2_character_id);
                if (encRes.success)
                    p2Enc = encRes.data;
            }
            // Generate the unified "Sensei Context"
            enrichedRequest.ai_context = (0, aiContextHelper_1.formatFullGameContextForAI)(gameMetadata || null, p1Rules, p2Rules, p1Enc, p2Enc);
        }
        catch (e) {
            console.error(`[AnalysisService] Enrichment failed:`, e);
        }
        return enrichedRequest;
    }
    /**
     * Processes the timeline events from an analysis and stores them in the vector database
     * if they are novel, or links them to existing scenarios if they are similar.
     */
    async processVectorIntelligence(analysisId, request, analysisResponse) {
        if (!this.vectorRepository || !analysisResponse.timeline)
            return;
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
                if (event.neutral_state)
                    contextParts.push(`Phase: ${event.neutral_state}.`);
                if (event.turn_owner)
                    contextParts.push(`Turn: ${event.turn_owner}.`);
                if (event.spacing)
                    contextParts.push(`Spacing: ${event.spacing}.`);
                if (event.frame_advantage)
                    contextParts.push(`Frame advantage: ${event.frame_advantage}.`);
                if (event.p1_state)
                    contextParts.push(`${analysisResponse.p1_character || 'P1'} state: ${event.p1_state}.`);
                if (event.p2_state)
                    contextParts.push(`${analysisResponse.p2_character || 'P2'} state: ${event.p2_state}.`);
                const contextText = contextParts.join(' ');
                const embedding = await this.aiService.generateEmbedding(contextText);
                // NOVELTY CHECK
                const similarScenarios = await this.vectorRepository.findSimilarScenarios(embedding, request.game_id || 'unknown', 1);
                let isNovel = true;
                let topScore = 0;
                if (similarScenarios && similarScenarios.length > 0) {
                    topScore = similarScenarios[0].score || 0;
                    // Threshold increased to 0.85 for better variety
                    if (topScore > 0.85)
                        isNovel = false;
                    console.log(`[VectorIntelligence] Situation: ${event.description.slice(0, 30)}... Score: ${topScore.toFixed(4)} -> Novel: ${isNovel}`);
                }
                else {
                    console.log(`[VectorIntelligence] No similar scenarios found. Situation is unique.`);
                }
                // Save scenario ONLY IF NOVEL to avoid duplicates
                const scenarioId = uuidHelper_1.UuidHelper.generate();
                if (isNovel) {
                    await this.vectorRepository.createScenario({
                        scenario_id: scenarioId,
                        game_id: request.game_id || 'unknown',
                        pro_player_id: request.pro_player_id,
                        description: event.description,
                        context: contextText,
                        characters_involved: [
                            this.sanitizeAiString(analysisResponse.p1_character),
                            this.sanitizeAiString(analysisResponse.p2_character)
                        ].filter(Boolean),
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
                        ].filter(Boolean);
                        const charLabel = chars.length > 0
                            ? chars.map(c => c.toUpperCase()).join(' & ')
                            : (request.game_id || 'UNKNOWN').toUpperCase();
                        const shortCtx = contextText.length > 120
                            ? contextText.slice(0, 117) + '…'
                            : contextText;
                        const usersToNotify = await User_1.default.find({
                            'slots.gameId': request.game_id,
                            'slots.notificationsEnabled': true
                        }).limit(100);
                        for (const user of usersToNotify) {
                            await this.notificationService.notify(user._id, 'TECH_DISCOVERY', {
                                gameId: request.game_id || 'unknown',
                                characterId: this.sanitizeAiString(analysisResponse.p1_character) || undefined,
                                title: `[${charLabel}] New tech — ${(event.event_type || 'Discovery').replace(/_/g, ' ')}`,
                                description: shortCtx,
                                link: `/dashboard/tech/${scenarioId}`,
                            });
                        }
                    }
                }
                else if (similarScenarios && similarScenarios.length > 0) {
                    // If not novel, link this match to the existing scenario
                    const existingScenario = similarScenarios[0];
                    await this.vectorRepository.addMatchReference(existingScenario.scenario_id, analysisId);
                }
            }
            catch (e) {
                console.error(`[VectorIntelligence] Failed for event:`, e);
            }
        }
    }
}
exports.AnalysisService = AnalysisService;
//# sourceMappingURL=AnalysisService.js.map