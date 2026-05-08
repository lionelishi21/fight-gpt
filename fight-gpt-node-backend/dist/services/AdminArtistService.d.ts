import { BaseService } from './BaseService';
import { IArtistProfileRepository } from '../repositories/ArtistProfileRepository';
import { IAdminArtistReviewRepository } from '../repositories/AdminArtistReviewRepository';
import { ITrackSubmissionRepository } from '../repositories/TrackSubmissionRepository';
import { IOnboardingDocumentRepository } from '../repositories/OnboardingDocumentRepository';
import { IArtistProfile } from '../models/ArtistProfile';
import { IAdminArtistReview } from '../models/AdminArtistReview';
export interface IAdminArtistService {
    getQueue(status?: string, limit?: number): Promise<IAdminArtistReview[]>;
    getReviewDetail(reviewId: string): Promise<{
        review: IAdminArtistReview;
        profile: IArtistProfile | null;
        documents: any[];
    }>;
    assignReview(reviewId: string, adminId: string): Promise<IAdminArtistReview | null>;
    addComment(reviewId: string, adminId: string, text: string, isInternal?: boolean): Promise<IAdminArtistReview | null>;
    updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null>;
    approveArtist(reviewId: string, adminId: string, notes?: string): Promise<IArtistProfile>;
    rejectArtist(reviewId: string, adminId: string, reason: string): Promise<IArtistProfile>;
    requestMoreInfo(reviewId: string, adminId: string, notes: string): Promise<IAdminArtistReview | null>;
    getPendingTracks(limit?: number): Promise<any[]>;
    approveTrack(trackId: string, adminId: string): Promise<any>;
    rejectTrack(trackId: string, adminId: string, reason: string): Promise<any>;
    listArtists(status?: string, limit?: number, offset?: number): Promise<{
        artists: IArtistProfile[];
        total: number;
    }>;
}
export declare class AdminArtistService extends BaseService implements IAdminArtistService {
    private readonly artistProfileRepo;
    private readonly reviewRepo;
    private readonly trackRepo;
    private readonly documentRepo;
    constructor(artistProfileRepo: IArtistProfileRepository, reviewRepo: IAdminArtistReviewRepository, trackRepo: ITrackSubmissionRepository, documentRepo: IOnboardingDocumentRepository);
    getQueue(status?: string, limit?: number): Promise<IAdminArtistReview[]>;
    getReviewDetail(reviewId: string): Promise<{
        review: IAdminArtistReview;
        profile: IArtistProfile | null;
        documents: any[];
    }>;
    assignReview(reviewId: string, adminId: string): Promise<IAdminArtistReview | null>;
    addComment(reviewId: string, adminId: string, text: string, isInternal?: boolean): Promise<IAdminArtistReview | null>;
    updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null>;
    approveArtist(reviewId: string, adminId: string, notes?: string): Promise<IArtistProfile>;
    rejectArtist(reviewId: string, adminId: string, reason: string): Promise<IArtistProfile>;
    requestMoreInfo(reviewId: string, adminId: string, notes: string): Promise<IAdminArtistReview | null>;
    getPendingTracks(limit?: number): Promise<any[]>;
    approveTrack(trackId: string, adminId: string): Promise<any>;
    rejectTrack(trackId: string, adminId: string, reason: string): Promise<any>;
    listArtists(status?: string, limit?: number, offset?: number): Promise<{
        artists: IArtistProfile[];
        total: number;
    }>;
}
//# sourceMappingURL=AdminArtistService.d.ts.map