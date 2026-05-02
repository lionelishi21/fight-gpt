"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const MetaReport_1 = require("../models/MetaReport");
class MetaRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(MetaReport_1.MetaReport);
    }
    async createReport(data) {
        return this.model.create(data);
    }
    async getLatestReport(gameId, period) {
        const filter = { game_id: gameId, status: 'ready' };
        if (period)
            filter.period = period;
        return this.model
            .findOne(filter)
            .sort({ generated_at: -1 })
            .exec();
    }
    async getReportById(reportId) {
        return this.model.findOne({ report_id: reportId }).exec();
    }
    async getReportHistory(gameId, limit = 10) {
        return this.model
            .find({ game_id: gameId, status: 'ready' })
            .sort({ generated_at: -1 })
            .limit(limit)
            .exec();
    }
    async updateReport(reportId, data) {
        return this.model
            .findOneAndUpdate({ report_id: reportId }, { $set: data }, { new: true })
            .exec();
    }
}
exports.MetaRepository = MetaRepository;
//# sourceMappingURL=MetaRepository.js.map