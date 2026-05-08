"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingDocumentRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const OnboardingDocument_1 = require("../models/OnboardingDocument");
class OnboardingDocumentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(OnboardingDocument_1.OnboardingDocument);
    }
    async findByArtistProfile(artistProfileId) {
        return this.model.find({ artistProfileId })
            .sort({ uploadedAt: -1 })
            .lean().exec();
    }
    async findByType(artistProfileId, documentType) {
        return this.model.findOne({ artistProfileId, documentType, status: { $ne: 'rejected' } })
            .sort({ uploadedAt: -1 })
            .lean().exec();
    }
    async findAllByType(artistProfileId, documentType) {
        return this.model.find({ artistProfileId, documentType })
            .sort({ uploadedAt: -1 })
            .lean().exec();
    }
    async updateStatus(docId, status, reviewedBy, rejectionReason) {
        const update = { status, reviewedBy, reviewedAt: new Date() };
        if (rejectionReason)
            update.rejectionReason = rejectionReason;
        return this.model.findByIdAndUpdate(docId, update, { new: true }).lean().exec();
    }
    async findPendingReview(limit = 20) {
        return this.model.find({ status: 'under_review' })
            .sort({ uploadedAt: 1 })
            .limit(limit).lean().exec();
    }
}
exports.OnboardingDocumentRepository = OnboardingDocumentRepository;
//# sourceMappingURL=OnboardingDocumentRepository.js.map