"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminArtistReviewRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const AdminArtistReview_1 = require("../models/AdminArtistReview");
const mongoose_1 = __importDefault(require("mongoose"));
class AdminArtistReviewRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(AdminArtistReview_1.AdminArtistReview);
    }
    async findByArtistProfile(artistProfileId) {
        return this.model.find({ artistProfileId })
            .sort({ created_at: -1 })
            .lean().exec();
    }
    async findActiveReview(artistProfileId) {
        return this.model.findOne({
            artistProfileId,
            status: { $in: ['queued', 'in_progress'] },
        }).lean().exec();
    }
    async findQueue(status = 'queued', limit = 50) {
        return this.model.find({ status })
            .sort({ priority: -1, created_at: 1 })
            .limit(limit)
            .populate('artistProfileId', 'stageName legalName country artistType')
            .lean().exec();
    }
    async assign(reviewId, adminId) {
        return this.model.findByIdAndUpdate(reviewId, { assignedTo: adminId, status: 'in_progress' }, { new: true }).lean().exec();
    }
    async addComment(reviewId, authorId, text, isInternal = true) {
        return this.model.findByIdAndUpdate(reviewId, {
            $push: {
                comments: {
                    authorId: new mongoose_1.default.Types.ObjectId(authorId),
                    text,
                    createdAt: new Date(),
                    isInternal,
                },
            },
        }, { new: true }).lean().exec();
    }
    async updateChecklist(reviewId, itemIndex, passed, notes) {
        const update = {
            [`checklist.${itemIndex}.passed`]: passed,
            [`checklist.${itemIndex}.checkedAt`]: new Date(),
        };
        if (notes)
            update[`checklist.${itemIndex}.notes`] = notes;
        return this.model.findByIdAndUpdate(reviewId, { $set: update }, { new: true }).lean().exec();
    }
    async resolve(reviewId, outcome, notes) {
        return this.model.findByIdAndUpdate(reviewId, {
            status: outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'more_info_requested',
            outcome,
            outcomeNotes: notes,
            outcomeAt: new Date(),
        }, { new: true }).lean().exec();
    }
}
exports.AdminArtistReviewRepository = AdminArtistReviewRepository;
//# sourceMappingURL=AdminArtistReviewRepository.js.map