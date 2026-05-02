import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { ChatService } from '../services/ChatService';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { IRivalRepository } from '../repositories/RivalRepository';
import { IGameRepository } from '../repositories/GameRepository';
import { IAnalysisRepository } from '../repositories/AnalysisRepository';
export declare class ChatController extends BaseController {
    private readonly chatService;
    private readonly auditLogRepository;
    private readonly rivalRepository?;
    private readonly gameRepository?;
    private readonly analysisRepository?;
    constructor(chatService: ChatService, auditLogRepository: AuditLogRepository | null, rivalRepository?: IRivalRepository, gameRepository?: IGameRepository, analysisRepository?: IAnalysisRepository);
    sendMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    clearChat: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=ChatController.d.ts.map