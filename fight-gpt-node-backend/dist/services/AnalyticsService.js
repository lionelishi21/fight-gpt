"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const BaseService_1 = require("./BaseService");
const AnalyticsRepository_1 = require("../repositories/AnalyticsRepository");
const logger_1 = require("../helpers/logger");
class AnalyticsService extends BaseService_1.BaseService {
    repository;
    constructor(repository) {
        super();
        this.repository = repository || new AnalyticsRepository_1.AnalyticsRepository();
    }
    /**
     * Fire-and-forget event recording
     */
    async recordEvent(request) {
        try {
            if (!request.event_type || !request.game_id) {
                logger_1.Logger.warn(`[AnalyticsService] Missing required fields for event: ${JSON.stringify(request)}`);
                return;
            }
            await this.repository.createEvent(request);
        }
        catch (error) {
            // We don't want analytics tracking to fail the main request
            logger_1.Logger.error(`[AnalyticsService] Failed to record event: ${error.message}`);
        }
    }
    async getEventCountsByType(limit = 10) {
        return this.repository.getEventCountsByType(limit);
    }
    async getMostQueriedRules(gameId, limit = 10) {
        return this.repository.getMostQueriedRules(gameId, limit);
    }
    async getMostQueriedCharacters(gameId, limit = 10) {
        return this.repository.getMostQueriedCharacters(gameId, limit);
    }
}
exports.AnalyticsService = AnalyticsService;
exports.default = AnalyticsService;
//# sourceMappingURL=AnalyticsService.js.map