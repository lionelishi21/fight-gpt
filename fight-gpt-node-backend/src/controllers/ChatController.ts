import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { ChatService, ChatMessage } from '../services/ChatService';
import { AuditLogRepository } from '../repositories/AuditLogRepository';

/**
 * Chat Controller
 * Handles chat-related HTTP requests
 * Follows Single Responsibility Principle - handles chat request/response
 */
export class ChatController extends BaseController {
  private chatService: ChatService;
  private auditLogRepository: AuditLogRepository | null;

  constructor(chatService: ChatService, auditLogRepository: AuditLogRepository | null) {
    super();
    this.chatService = chatService;
    this.auditLogRepository = auditLogRepository;
  }

  /**
   * Send a chat message
   * POST /api/chat
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, history } = req.body;

      // Validate message
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        this.sendResponse(res, { success: false, error: 'Message is required and must be a non-empty string' }, 400);
        return;
      }

      // Validate history if provided
      if (history && !Array.isArray(history)) {
        this.sendResponse(res, { success: false, error: 'History must be an array' }, 400);
        return;
      }

      // Process chat message
      const conversationHistory: ChatMessage[] = history || [];
      const response = await this.chatService.sendMessage(message.trim(), conversationHistory);

      // Log the request (if audit log repository is available)
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
        }).catch((err) => {
          console.error('[ChatController] Failed to create audit log:', err);
        });
      }

      if (response.success) {
        this.sendResponse(res, {
          success: true,
          data: {
            message: response.message,
            content: response.message, // For compatibility
          },
        }, 200);
      } else {
        this.sendResponse(res, {
          success: false,
          error: response.error || 'Failed to get response',
        }, 400);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clear chat history (placeholder - could be used for session management)
   * POST /api/chat/clear
   */
  clearChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Log the request (if audit log repository is available)
      if (this.auditLogRepository) {
        const requestId = this.getRequestId(req);
        await this.auditLogRepository.createAuditLog({
          request_id: requestId,
          endpoint: '/api/chat/clear',
          method: 'POST',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          response_status: 200,
        }).catch((err) => {
          console.error('[ChatController] Failed to create audit log:', err);
        });
      }

      this.sendResponse(res, {
        success: true,
        message: 'Chat cleared successfully',
      }, 200);
    } catch (error) {
      next(error);
    }
  };
}
