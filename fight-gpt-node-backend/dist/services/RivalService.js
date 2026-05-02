"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RivalService = void 0;
const BaseService_1 = require("./BaseService");
class RivalService extends BaseService_1.BaseService {
    rivalRepository;
    constructor(rivalRepository) {
        super();
        this.rivalRepository = rivalRepository;
    }
    async createRival(userId, targetName, gameId, targetCharacterId) {
        try {
            // Check for existing rival for this user/game/target combo to prevent duplicates
            const existing = await this.rivalRepository.model.findOne({ userId, targetName: { $regex: new RegExp(`^${targetName}$`, 'i') }, gameId });
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to create rival' };
        }
    }
    async deleteRival(userId, rivalId) {
        try {
            const result = await this.rivalRepository.model.deleteOne({ _id: rivalId, userId });
            if (result.deletedCount === 0) {
                return { success: false, error: 'Rival not found or unauthorized' };
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to delete rival' };
        }
    }
    async getRivalsByUser(userId) {
        try {
            const rivals = await this.rivalRepository.getRivalsByUserId(userId);
            return { success: true, data: rivals };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch rivals' };
        }
    }
}
exports.RivalService = RivalService;
exports.default = RivalService;
//# sourceMappingURL=RivalService.js.map