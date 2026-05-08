"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackSubmissionRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const TrackSubmission_1 = require("../models/TrackSubmission");
class TrackSubmissionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(TrackSubmission_1.TrackSubmission);
    }
    async findByArtistProfile(artistProfileId, status) {
        const filter = { artistProfileId };
        if (status)
            filter.status = status;
        return this.model.find(filter)
            .sort({ created_at: -1 })
            .lean().exec();
    }
    async findPendingReview(limit = 20) {
        return this.model.find({ status: 'under_review' })
            .sort({ submittedAt: 1 })
            .limit(limit).lean().exec();
    }
    async updateStatus(trackId, status, reviewedBy, rejectionReason) {
        const update = { status, reviewedBy };
        if (status === 'approved')
            update.approvedAt = new Date();
        if (status === 'live')
            update.liveAt = new Date();
        if (rejectionReason)
            update.rejectionReason = rejectionReason;
        return this.model.findByIdAndUpdate(trackId, update, { new: true }).lean().exec();
    }
    async setLive(trackId) {
        return this.model.findByIdAndUpdate(trackId, { status: 'live', liveAt: new Date() }, { new: true }).lean().exec();
    }
    async updateFingerprintStatus(trackId, status, details) {
        const update = { fingerprintStatus: status };
        if (details)
            update.fingerprintMatchDetails = details;
        return this.model.findByIdAndUpdate(trackId, update, { new: true }).lean().exec();
    }
}
exports.TrackSubmissionRepository = TrackSubmissionRepository;
//# sourceMappingURL=TrackSubmissionRepository.js.map