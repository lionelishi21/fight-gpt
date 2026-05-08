"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistProfileRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const ArtistProfile_1 = require("../models/ArtistProfile");
class ArtistProfileRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(ArtistProfile_1.ArtistProfile);
    }
    async findByUserId(userId) {
        return this.findOne({ userId });
    }
    async findByStatus(status, limit = 20, offset = 0) {
        return this.model.find({ onboardingStatus: status })
            .sort({ submittedAt: 1, created_at: 1 })
            .skip(offset).limit(limit).lean().exec();
    }
    async countByStatus(status) {
        return this.model.countDocuments({ onboardingStatus: status });
    }
    async searchArtists(query, filters = {}) {
        const filter = { ...filters };
        if (query) {
            filter.$or = [
                { stageName: { $regex: query, $options: 'i' } },
                { legalName: { $regex: query, $options: 'i' } },
            ];
        }
        return this.model.find(filter).sort({ created_at: -1 }).limit(50).lean().exec();
    }
    async findPendingReview(limit = 20) {
        return this.model.find({ onboardingStatus: 'pending_review' })
            .sort({ submittedAt: 1 })
            .limit(limit).lean().exec();
    }
    async advanceStep(artistProfileId, step) {
        return this.model.findByIdAndUpdate(artistProfileId, { $max: { onboardingStep: step } }, { new: true }).lean().exec();
    }
}
exports.ArtistProfileRepository = ArtistProfileRepository;
//# sourceMappingURL=ArtistProfileRepository.js.map