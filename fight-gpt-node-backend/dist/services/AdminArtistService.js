"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminArtistService = void 0;
const BaseService_1 = require("./BaseService");
class AdminArtistService extends BaseService_1.BaseService {
    artistProfileRepo;
    reviewRepo;
    trackRepo;
    documentRepo;
    constructor(artistProfileRepo, reviewRepo, trackRepo, documentRepo) {
        super();
        this.artistProfileRepo = artistProfileRepo;
        this.reviewRepo = reviewRepo;
        this.trackRepo = trackRepo;
        this.documentRepo = documentRepo;
    }
    async getQueue(status = 'queued', limit = 50) {
        return this.reviewRepo.findQueue(status, limit);
    }
    async getReviewDetail(reviewId) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        const profileId = review.artistProfileId.toString();
        const profile = await this.artistProfileRepo.findById(profileId);
        const documents = profile ? await this.documentRepo.findByArtistProfile(profileId) : [];
        return { review, profile, documents };
    }
    async assignReview(reviewId, adminId) {
        return this.reviewRepo.assign(reviewId, adminId);
    }
    async addComment(reviewId, adminId, text, isInternal = true) {
        return this.reviewRepo.addComment(reviewId, adminId, text, isInternal);
    }
    async updateChecklist(reviewId, itemIndex, passed, notes) {
        return this.reviewRepo.updateChecklist(reviewId, itemIndex, passed, notes);
    }
    async approveArtist(reviewId, adminId, notes) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        await this.reviewRepo.resolve(reviewId, 'approved', notes);
        const profileId = review.artistProfileId.toString();
        await this.artistProfileRepo.update(profileId, {
            onboardingStatus: 'approved',
            approvedAt: new Date(),
            approvedBy: adminId,
        });
        const profile = await this.artistProfileRepo.findById(profileId);
        if (!profile)
            throw new Error('Profile not found after approval');
        return profile;
    }
    async rejectArtist(reviewId, adminId, reason) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        await this.reviewRepo.resolve(reviewId, 'rejected', reason);
        const profileId = review.artistProfileId.toString();
        await this.artistProfileRepo.update(profileId, {
            onboardingStatus: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: adminId,
            rejectionReason: reason,
        });
        const profile = await this.artistProfileRepo.findById(profileId);
        if (!profile)
            throw new Error('Profile not found after rejection');
        return profile;
    }
    async requestMoreInfo(reviewId, adminId, notes) {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review)
            throw new Error('Review not found');
        await this.reviewRepo.resolve(reviewId, 'more_info_requested', notes);
        const profileId = review.artistProfileId.toString();
        await this.artistProfileRepo.update(profileId, { onboardingStatus: 'draft' });
        return this.reviewRepo.findById(reviewId);
    }
    async getPendingTracks(limit = 20) {
        return this.trackRepo.findPendingReview(limit);
    }
    async approveTrack(trackId, adminId) {
        return this.trackRepo.updateStatus(trackId, 'approved', adminId);
    }
    async rejectTrack(trackId, adminId, reason) {
        return this.trackRepo.updateStatus(trackId, 'rejected', adminId, reason);
    }
    async listArtists(status, limit = 20, offset = 0) {
        const [artists, total] = await Promise.all([
            status
                ? this.artistProfileRepo.findByStatus(status, limit, offset)
                : this.artistProfileRepo.findMany({}, { sort: { created_at: -1 }, limit }),
            status
                ? this.artistProfileRepo.countByStatus(status)
                : this.artistProfileRepo.count({}),
        ]);
        return { artists, total };
    }
}
exports.AdminArtistService = AdminArtistService;
//# sourceMappingURL=AdminArtistService.js.map