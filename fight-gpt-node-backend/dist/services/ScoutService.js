"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoutService = void 0;
const BaseService_1 = require("./BaseService");
const ProPlayer_1 = require("../models/ProPlayer");
const logger_1 = require("../helpers/logger");
class ScoutService extends BaseService_1.BaseService {
    ingestionService;
    constructor(ingestionService) {
        super();
        this.ingestionService = ingestionService;
    }
    /**
     * Finds verified pro players for a game and triggers ingestion for their latest footage
     */
    async syncProFootage(gameId) {
        try {
            const pros = await ProPlayer_1.ProPlayer.find({ gameId, isVerified: true }).exec();
            logger_1.Logger.info(`[ScoutService] Syncing footage for ${pros.length} pro players in ${gameId}`);
            for (const pro of pros) {
                // Use the pro's name + game as a search query
                // In a real prod scenario, we would use their specific channel IDs
                const query = `${pro.name} ${gameId} high level matches recent`;
                await this.ingestionService.triggerIngestion(gameId, 3); // Seed some jobs
                // Update last sync time
                pro.lastIngestJobAt = new Date();
                await pro.save();
            }
        }
        catch (error) {
            logger_1.Logger.error('[ScoutService] Failed to sync pro footage', error);
        }
    }
}
exports.ScoutService = ScoutService;
exports.default = ScoutService;
//# sourceMappingURL=ScoutService.js.map