import { BaseRepository, IBaseRepository } from './BaseRepository';
import { AdminArtistReview, IAdminArtistReview } from '../models/AdminArtistReview';
import mongoose from 'mongoose';

export interface IAdminArtistReviewRepository extends IBaseRepository<IAdminArtistReview> {
    findByArtistProfile(artistProfileId: string): Promise<IAdminArtistReview[]>;
    findActiveReview(artistProfileId: string): Promise<IAdminArtistReview | null>;
    findQueue(status?: string, limit?: number): Promise<IAdminArtistReview[]>;
    assign(reviewId: string, adminId: string): Promise<IAdminArtistReview | null>;
    addComment(reviewId: string, authorId: string, text: string, isInternal?: boolean): Promise<IAdminArtistReview | null>;
    updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null>;
    resolve(reviewId: string, outcome: IAdminArtistReview['outcome'], notes?: string): Promise<IAdminArtistReview | null>;
}

export class AdminArtistReviewRepository
    extends BaseRepository<IAdminArtistReview>
    implements IAdminArtistReviewRepository
{
    constructor() {
        super(AdminArtistReview);
    }

    async findByArtistProfile(artistProfileId: string): Promise<IAdminArtistReview[]> {
        return this.model.find({ artistProfileId })
            .sort({ created_at: -1 })
            .lean().exec() as any;
    }

    async findActiveReview(artistProfileId: string): Promise<IAdminArtistReview | null> {
        return this.model.findOne({
            artistProfileId,
            status: { $in: ['queued', 'in_progress'] },
        }).lean().exec() as any;
    }

    async findQueue(status = 'queued', limit = 50): Promise<IAdminArtistReview[]> {
        return this.model.find({ status })
            .sort({ priority: -1, created_at: 1 })
            .limit(limit)
            .populate('artistProfileId', 'stageName legalName country artistType')
            .lean().exec() as any;
    }

    async assign(reviewId: string, adminId: string): Promise<IAdminArtistReview | null> {
        return this.model.findByIdAndUpdate(
            reviewId,
            { assignedTo: adminId, status: 'in_progress' },
            { new: true }
        ).lean().exec() as any;
    }

    async addComment(
        reviewId: string,
        authorId: string,
        text: string,
        isInternal = true
    ): Promise<IAdminArtistReview | null> {
        return this.model.findByIdAndUpdate(
            reviewId,
            {
                $push: {
                    comments: {
                        authorId: new mongoose.Types.ObjectId(authorId),
                        text,
                        createdAt: new Date(),
                        isInternal,
                    },
                },
            },
            { new: true }
        ).lean().exec() as any;
    }

    async updateChecklist(
        reviewId: string,
        itemIndex: number,
        passed: boolean,
        notes?: string
    ): Promise<IAdminArtistReview | null> {
        const update: any = {
            [`checklist.${itemIndex}.passed`]: passed,
            [`checklist.${itemIndex}.checkedAt`]: new Date(),
        };
        if (notes) update[`checklist.${itemIndex}.notes`] = notes;
        return this.model.findByIdAndUpdate(reviewId, { $set: update }, { new: true }).lean().exec() as any;
    }

    async resolve(
        reviewId: string,
        outcome: IAdminArtistReview['outcome'],
        notes?: string
    ): Promise<IAdminArtistReview | null> {
        return this.model.findByIdAndUpdate(
            reviewId,
            {
                status: outcome === 'approved' ? 'approved' : outcome === 'rejected' ? 'rejected' : 'more_info_requested',
                outcome,
                outcomeNotes: notes,
                outcomeAt: new Date(),
            },
            { new: true }
        ).lean().exec() as any;
    }
}
