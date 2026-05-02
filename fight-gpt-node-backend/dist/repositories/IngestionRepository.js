"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const IngestionJob_1 = require("../models/IngestionJob");
class IngestionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(IngestionJob_1.IngestionJob);
    }
    async createJob(data) {
        return this.model.create(data);
    }
    async findByUrl(youtubeUrl) {
        return this.model.findOne({ youtube_url: youtubeUrl }).exec();
    }
    async getPendingJobs(gameId, limit = 10) {
        const filter = { status: 'pending' };
        if (gameId)
            filter.game_id = gameId;
        return this.model
            .find(filter)
            .sort({ created_at: 1 }) // oldest first (FIFO)
            .limit(limit)
            .exec();
    }
    async updateJobStatus(jobId, status, extra) {
        const update = { status, ...extra };
        if (status === 'completed' || status === 'failed') {
            update.processed_at = new Date();
        }
        return this.model
            .findOneAndUpdate({ job_id: jobId }, { $set: update }, { new: true })
            .exec();
    }
    async getJobStats(gameId) {
        const [total, completed, failed, pending] = await Promise.all([
            this.model.countDocuments({ game_id: gameId }),
            this.model.countDocuments({ game_id: gameId, status: 'completed' }),
            this.model.countDocuments({ game_id: gameId, status: 'failed' }),
            this.model.countDocuments({ game_id: gameId, status: 'pending' }),
        ]);
        return { total, completed, failed, pending };
    }
    async getRecentJobs(gameId, limit = 20) {
        return this.model
            .find({ game_id: gameId })
            .sort({ created_at: -1 })
            .limit(limit)
            .exec();
    }
}
exports.IngestionRepository = IngestionRepository;
//# sourceMappingURL=IngestionRepository.js.map