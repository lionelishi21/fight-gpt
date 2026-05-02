"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const AnalyticsEvent_1 = require("../models/AnalyticsEvent");
class AnalyticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(AnalyticsEvent_1.AnalyticsEvent);
    }
    async createEvent(data) {
        return this.model.create(data);
    }
    async getEventCountsByType(limit = 10) {
        return this.model.aggregate([
            { $group: { _id: '$event_type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }
    async getMostQueriedRules(gameId, limit = 10) {
        const matchStage = { event_type: 'game_rule_query', rule_key: { $exists: true, $ne: null } };
        if (gameId)
            matchStage.game_id = gameId;
        return this.model.aggregate([
            { $match: matchStage },
            { $group: { _id: '$rule_key', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }
    async getMostQueriedCharacters(gameId, limit = 10) {
        const matchStage = { event_type: 'character_encyclopedia_query', character_id: { $exists: true, $ne: null } };
        if (gameId)
            matchStage.game_id = gameId;
        return this.model.aggregate([
            { $match: matchStage },
            { $group: { _id: '$character_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }
}
exports.AnalyticsRepository = AnalyticsRepository;
exports.default = AnalyticsRepository;
//# sourceMappingURL=AnalyticsRepository.js.map