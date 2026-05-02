import { IRivalRepository } from '../repositories/RivalRepository';
import { IRivalDocument } from '../models/Rival';
import { BaseService } from './BaseService';
import { ApiResponse } from '../types';
export interface IRivalService {
    createRival(userId: string, targetName: string, gameId: string, targetCharacterId?: string): Promise<ApiResponse<IRivalDocument>>;
    deleteRival(userId: string, rivalId: string): Promise<ApiResponse<void>>;
    getRivalsByUser(userId: string): Promise<ApiResponse<IRivalDocument[]>>;
}
export declare class RivalService extends BaseService implements IRivalService {
    private readonly rivalRepository;
    constructor(rivalRepository: IRivalRepository);
    createRival(userId: string, targetName: string, gameId: string, targetCharacterId?: string): Promise<ApiResponse<IRivalDocument>>;
    deleteRival(userId: string, rivalId: string): Promise<ApiResponse<void>>;
    getRivalsByUser(userId: string): Promise<ApiResponse<IRivalDocument[]>>;
}
export default RivalService;
//# sourceMappingURL=RivalService.d.ts.map