import { BaseService } from './BaseService';
import { IArtistProfileRepository } from '../repositories/ArtistProfileRepository';
import { IAdminArtistReviewRepository } from '../repositories/AdminArtistReviewRepository';
import { ITrackSubmissionRepository } from '../repositories/TrackSubmissionRepository';
import { IOnboardingDocumentRepository } from '../repositories/OnboardingDocumentRepository';
import { IArtistProfile } from '../models/ArtistProfile';
import { IAdminArtistReview } from '../models/AdminArtistReview';

export interface IAdminArtistService {
    getQueue(status?: string, limit?: number): Promise<IAdminArtistReview[]>;
    getReviewDetail(reviewId: string): Promise<{ review: IAdminArtistReview; profile: IArtistProfile | null; documents: any[] }>;
    assignReview(reviewId: string, adminId: string): Promise<IAdminArtistReview | null>;
    addComment(reviewId: string, adminId: string, text: string, isInternal?: boolean): Promise<IAdminArtistReview | null>;
    updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null>;
    approveArtist(reviewId: string, adminId: string, notes?: string): Promise<IArtistProfile>;
    rejectArtist(reviewId: string, adminId: string, reason: string): Promise<IArtistProfile>;
    requestMoreInfo(reviewId: string, adminId: string, notes: string): Promise<IAdminArtistReview | null>;
    getPendingTracks(limit?: number): Promise<any[]>;
    approveTrack(trackId: string, adminId: string): Promise<any>;
    rejectTrack(trackId: string, adminId: string, reason: string): Promise<any>;
    listArtists(status?: string, limit?: number, offset?: number): Promise<{ artists: IArtistProfile[]; total: number }>;
}

export class AdminArtistService extends BaseService implements IAdminArtistService {
    constructor(
        private readonly artistProfileRepo: IArtistProfileRepository,
        private readonly reviewRepo: IAdminArtistReviewRepository,
        private readonly trackRepo: ITrackSubmissionRepository,
        private readonly documentRepo: IOnboardingDocumentRepository
    ) {
        super();
    }

    async getQueue(status = 'queued', limit = 50): Promise<IAdminArtistReview[]> {
        return this.reviewRepo.findQueue(status, limit);
    }

    async getReviewDetail(reviewId: string): Promise<{ review: IAdminArtistReview; profile: IArtistProfile | null; documents: any[] }> {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review) throw new Error('Review not found');

        const profileId = review.artistProfileId.toString();
        const profile = await this.artistProfileRepo.findById(profileId);
        const documents = profile ? await this.documentRepo.findByArtistProfile(profileId) : [];

        return { review, profile, documents };
    }

    async assignReview(reviewId: string, adminId: string): Promise<IAdminArtistReview | null> {
        return this.reviewRepo.assign(reviewId, adminId);
    }

    async addComment(reviewId: string, adminId: string, text: string, isInternal = true): Promise<IAdminArtistReview | null> {
        return this.reviewRepo.addComment(reviewId, adminId, text, isInternal);
    }

    async updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null> {
        return this.reviewRepo.updateChecklist(reviewId, itemIndex, passed, notes);
    }

    async approveArtist(reviewId: string, adminId: string, notes?: string): Promise<IArtistProfile> {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review) throw new Error('Review not found');

        await this.reviewRepo.resolve(reviewId, 'approved', notes);

        const profileId = review.artistProfileId.toString();
        await this.artistProfileRepo.update(profileId, {
            onboardingStatus: 'approved',
            approvedAt: new Date(),
            approvedBy: adminId as any,
        });

        const profile = await this.artistProfileRepo.findById(profileId);
        if (!profile) throw new Error('Profile not found after approval');
        return profile;
    }

    async rejectArtist(reviewId: string, adminId: string, reason: string): Promise<IArtistProfile> {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review) throw new Error('Review not found');

        await this.reviewRepo.resolve(reviewId, 'rejected', reason);

        const profileId = review.artistProfileId.toString();
        await this.artistProfileRepo.update(profileId, {
            onboardingStatus: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: adminId as any,
            rejectionReason: reason,
        });

        const profile = await this.artistProfileRepo.findById(profileId);
        if (!profile) throw new Error('Profile not found after rejection');
        return profile;
    }

    async requestMoreInfo(reviewId: string, adminId: string, notes: string): Promise<IAdminArtistReview | null> {
        const review = await this.reviewRepo.findById(reviewId);
        if (!review) throw new Error('Review not found');

        await this.reviewRepo.resolve(reviewId, 'more_info_requested', notes);

        const profileId = review.artistProfileId.toString();
        await this.artistProfileRepo.update(profileId, { onboardingStatus: 'draft' });

        return this.reviewRepo.findById(reviewId);
    }

    async getPendingTracks(limit = 20): Promise<any[]> {
        return this.trackRepo.findPendingReview(limit);
    }

    async approveTrack(trackId: string, adminId: string): Promise<any> {
        return this.trackRepo.updateStatus(trackId, 'approved', adminId);
    }

    async rejectTrack(trackId: string, adminId: string, reason: string): Promise<any> {
        return this.trackRepo.updateStatus(trackId, 'rejected', adminId, reason);
    }

    async listArtists(status?: string, limit = 20, offset = 0): Promise<{ artists: IArtistProfile[]; total: number }> {
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
