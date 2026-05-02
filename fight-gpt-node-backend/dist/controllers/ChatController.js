"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const BaseController_1 = require("./BaseController");
const User_1 = __importDefault(require("../models/User"));
class ChatController extends BaseController_1.BaseController {
    chatService;
    auditLogRepository;
    rivalRepository;
    gameRepository;
    analysisRepository;
    constructor(chatService, auditLogRepository, rivalRepository, gameRepository, analysisRepository) {
        super();
        this.chatService = chatService;
        this.auditLogRepository = auditLogRepository;
        this.rivalRepository = rivalRepository;
        this.gameRepository = gameRepository;
        this.analysisRepository = analysisRepository;
    }
    sendMessage = async (req, res, next) => {
        try {
            const { message, history } = req.body;
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                this.sendResponse(res, { success: false, error: 'Message is required and must be a non-empty string' }, 400);
                return;
            }
            if (history && !Array.isArray(history)) {
                this.sendResponse(res, { success: false, error: 'History must be an array' }, 400);
                return;
            }
            const conversationHistory = history || [];
            const userId = req.user?.id;
            let response;
            // If authenticated and repos available, use contextual chat
            if (userId && this.rivalRepository && this.gameRepository) {
                try {
                    const [user, rivals, games] = await Promise.all([
                        User_1.default.findById(userId).lean(),
                        this.rivalRepository.getRivalsByUserId(userId),
                        this.gameRepository.findActiveGames(),
                    ]);
                    // Fetch player analyses for tracked rivals (only for premium users)
                    let playerAnalyses = [];
                    if (user?.planType === 'premium' && this.analysisRepository && rivals.length > 0) {
                        const recentAnalyses = await this.analysisRepository.getRecentAnalyses(50);
                        playerAnalyses = recentAnalyses
                            .filter((a) => a.analysis?.p1_name || a.analysis?.p2_name)
                            .flatMap((a) => {
                            const entries = [];
                            if (a.analysis?.p1_name)
                                entries.push({ playerName: a.analysis.p1_name, gameId: a.game_id, analysisId: a.analysis_id, character: a.analysis.p1_character });
                            if (a.analysis?.p2_name)
                                entries.push({ playerName: a.analysis.p2_name, gameId: a.game_id, analysisId: a.analysis_id, character: a.analysis.p2_character });
                            return entries;
                        })
                            .filter((e) => rivals.some(r => r.targetName.toLowerCase() === e.playerName?.toLowerCase()));
                    }
                    const ctx = {
                        planType: user?.planType === 'premium' ? 'premium' : 'free',
                        slots: user?.slots || [],
                        rivals: rivals.map((r) => ({ name: r.targetName, gameId: r.gameId, characterId: r.characterId })),
                        games: games.map((g) => ({ name: g.name, game_id: g.game_id, aliases: g.aliases || [] })),
                        playerAnalyses,
                    };
                    response = await this.chatService.sendContextualMessage(message.trim(), conversationHistory, ctx);
                }
                catch (ctxErr) {
                    console.error('[ChatController] Context fetch failed, falling back:', ctxErr);
                    response = await this.chatService.sendMessage(message.trim(), conversationHistory);
                }
            }
            else {
                response = await this.chatService.sendMessage(message.trim(), conversationHistory);
            }
            if (this.auditLogRepository) {
                const requestId = this.getRequestId(req);
                await this.auditLogRepository.createAuditLog({
                    request_id: requestId,
                    endpoint: '/api/chat',
                    method: 'POST',
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent'],
                    request_body: { message: message.trim() },
                    response_status: response.success ? 200 : 400,
                }).catch(() => { });
            }
            if (response.success) {
                this.sendResponse(res, {
                    success: true,
                    data: {
                        message: response.message,
                        content: response.message,
                        detectedEntities: response.detectedEntities,
                        requiresUpgrade: response.requiresUpgrade,
                        requiresUrl: response.requiresUrl,
                    },
                }, 200);
            }
            else {
                this.sendResponse(res, { success: false, error: response.error || 'Failed to get response' }, 400);
            }
        }
        catch (error) {
            next(error);
        }
    };
    clearChat = async (req, res, next) => {
        try {
            if (this.auditLogRepository) {
                const requestId = this.getRequestId(req);
                await this.auditLogRepository.createAuditLog({
                    request_id: requestId, endpoint: '/api/chat/clear', method: 'POST',
                    ip_address: req.ip, user_agent: req.headers['user-agent'], response_status: 200,
                }).catch(() => { });
            }
            this.sendResponse(res, { success: true, message: 'Chat cleared successfully' }, 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ChatController = ChatController;
//# sourceMappingURL=ChatController.js.map