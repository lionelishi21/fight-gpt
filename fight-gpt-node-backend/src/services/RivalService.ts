import { IRivalRepository } from '../repositories/RivalRepository';
import { IRivalDocument } from '../models/Rival';
import { BaseService } from './BaseService';
import { ApiResponse } from '../types';

export interface IRivalService {
    createRival(userId: string, targetName: string, gameId: string, targetCharacterId?: string): Promise<ApiResponse<IRivalDocument>>;
    deleteRival(userId: string, rivalId: string): Promise<ApiResponse<void>>;
    getRivalsByUser(userId: string): Promise<ApiResponse<IRivalDocument[]>>;
}

export class RivalService extends BaseService implements IRivalService {
    constructor(private readonly rivalRepository: IRivalRepository) {
        super();
    }

    public async createRival(userId: string, targetName: string, gameId: string, targetCharacterId?: string): Promise<ApiResponse<IRivalDocument>> {
        try {
            // Check for existing rival for this user/game/target combo to prevent duplicates
            const existing = await (this.rivalRepository as any).model.findOne({ userId, targetName: { $regex: new RegExp(`^${targetName}$`, 'i') }, gameId });
            if (existing) {
                return { success: false, error: 'Target is already being tracked' };
            }

            const rival = await this.rivalRepository.createRival({
                userId,
                targetName,
                gameId,
                targetCharacterId
            });

            return { success: true, data: rival };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create rival' };
        }
    }

    public async deleteRival(userId: string, rivalId: string): Promise<ApiResponse<void>> {
        try {
            const result = await (this.rivalRepository as any).model.deleteOne({ _id: rivalId, userId });
            if (result.deletedCount === 0) {
                return { success: false, error: 'Rival not found or unauthorized' };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to delete rival' };
        }
    }

    public async getRivalsByUser(userId: string): Promise<ApiResponse<IRivalDocument[]>> {
        try {
            const rivals = await this.rivalRepository.getRivalsByUserId(userId);
            return { success: true, data: rivals };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch rivals' };
        }
    }
}

export default RivalService;
