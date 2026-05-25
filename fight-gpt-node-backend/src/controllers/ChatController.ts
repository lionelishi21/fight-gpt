import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { ChatService, ChatMessage, UserChatContext, SmartChatResponse } from '../services/ChatService';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { IRivalRepository } from '../repositories/RivalRepository';
import { IGameRepository } from '../repositories/GameRepository';
import { IAnalysisRepository } from '../repositories/AnalysisRepository';
import User from '../models/User';

export class ChatController extends BaseController {
  private io: any;

  constructor(
    private readonly chatService: ChatService,
    private readonly auditLogRepository: AuditLogRepository | null,
    private readonly rivalRepository?: IRivalRepository,
    private readonly gameRepository?: IGameRepository,
    private readonly analysisRepository?: IAnalysisRepository,
  ) {
    super();
  }

  setIo(io: any) {
    this.io = io;
  }

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        this.sendResponse(res, { success: false, error: 'Unauthorized' }, 401);
        return;
      }

      const ChatMessage = require('../models/ChatMessage').default;
      const history = await ChatMessage.find({ userId })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();

      this.sendResponse(res, { success: true, data: history }, 200);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const conversationHistory: ChatMessage[] = history || [];
      const userId = (req as any).user?.id;

      let response: SmartChatResponse;
      let ctx: UserChatContext | undefined;

      // If authenticated and repos available, use contextual chat
      if (userId && this.rivalRepository && this.gameRepository) {
        try {
          const [user, rivals, games] = await Promise.all([
            User.findById(userId).lean(),
            this.rivalRepository.getRivalsByUserId(userId),
            this.gameRepository.findActiveGames(),
          ]);

          // Fetch player analyses for tracked rivals (only for premium users)
          let playerAnalyses: UserChatContext['playerAnalyses'] = [];
          if ((user as any)?.planType === 'premium' && this.analysisRepository && rivals.length > 0) {
            const recentAnalyses = await this.analysisRepository.getRecentAnalyses(50);
            playerAnalyses = recentAnalyses
              .filter((a: any) => a.analysis?.p1_name || a.analysis?.p2_name)
              .flatMap((a: any) => {
                const entries = [];
                if (a.analysis?.p1_name) entries.push({ playerName: a.analysis.p1_name, gameId: a.game_id, analysisId: a.analysis_id, character: a.analysis.p1_character });
                if (a.analysis?.p2_name) entries.push({ playerName: a.analysis.p2_name, gameId: a.game_id, analysisId: a.analysis_id, character: a.analysis.p2_character });
                return entries;
              })
              .filter((e: any) => rivals.some(r => r.targetName.toLowerCase() === e.playerName?.toLowerCase()));
          }

          ctx = {
            planType: (user as any)?.planType === 'premium' ? 'premium' : 'free',
            slots: (user as any)?.slots || [],
            rivals: rivals.map((r: any) => ({ name: r.targetName, gameId: r.gameId, characterId: r.characterId })),
            games: (games as any[]).map((g: any) => ({ name: g.name, game_id: g.game_id, aliases: g.aliases || [] })),
            playerAnalyses,
          };

          response = await this.chatService.sendContextualMessage(message.trim(), conversationHistory, ctx);
        } catch (ctxErr) {
          console.error('[ChatController] Context fetch failed, falling back:', ctxErr);
          response = await this.chatService.sendMessage(message.trim(), conversationHistory, ctx?.planType === 'premium');
        }
      } else {
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
        }).catch(() => {});
      }

      if (response.success) {
        // Save to database if authenticated
        if (userId) {
          const ChatMessage = require('../models/ChatMessage').default;
          
          // Save user message
          const userMsg = await ChatMessage.create({
            userId,
            role: 'user',
            content: message.trim(),
            metadata: {
              gameId: ctx?.slots?.[0]?.gameId,
              characterId: ctx?.slots?.[0]?.characterId,
            }
          });

          // Save assistant message
          const assistantMsg = await ChatMessage.create({
            userId,
            role: 'assistant',
            content: response.message,
            metadata: {
              detectedEntities: (response as any).detectedEntities,
            }
          });

          // Broadcast to all user's devices via Socket.io
          if (this.io) {
            this.io.to(`user_${userId}`).emit('new_message', {
              userMessage: userMsg,
              assistantMessage: assistantMsg
            });
          }
        }

        this.sendResponse(res, {
          success: true,
          data: {
            message: response.message,
            content: response.message,
            detectedEntities: (response as any).detectedEntities,
            requiresUpgrade: (response as any).requiresUpgrade,
            requiresUrl: (response as any).requiresUrl,
          },
        }, 200);
      } else {
        this.sendResponse(res, { success: false, error: response.error || 'Failed to get response' }, 400);
      }
    } catch (error) {
      next(error);
    }
  };

  clearChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (userId) {
        const ChatMessage = require('../models/ChatMessage').default;
        await ChatMessage.deleteMany({ userId });
      }

      if (this.auditLogRepository) {
        const requestId = this.getRequestId(req);
        await this.auditLogRepository.createAuditLog({
          request_id: requestId, endpoint: '/api/chat/clear', method: 'POST',
          ip_address: req.ip, user_agent: req.headers['user-agent'], response_status: 200,
        }).catch(() => {});
      }
      this.sendResponse(res, { success: true, message: 'Chat cleared successfully' }, 200);
    } catch (error) {
      next(error);
    }
  };
}
