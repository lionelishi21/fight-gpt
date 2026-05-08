import { BaseRepository, IBaseRepository } from './BaseRepository';
import { IAdminArtistReview } from '../models/AdminArtistReview';
export interface IAdminArtistReviewRepository extends IBaseRepository<IAdminArtistReview> {
    findByArtistProfile(artistProfileId: string): Promise<IAdminArtistReview[]>;
    findActiveReview(artistProfileId: string): Promise<IAdminArtistReview | null>;
    findQueue(status?: string, limit?: number): Promise<IAdminArtistReview[]>;
    assign(reviewId: string, adminId: string): Promise<IAdminArtistReview | null>;
    addComment(reviewId: string, authorId: string, text: string, isInternal?: boolean): Promise<IAdminArtistReview | null>;
    updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null>;
    resolve(reviewId: string, outcome: IAdminArtistReview['outcome'], notes?: string): Promise<IAdminArtistReview | null>;
}
export declare class AdminArtistReviewRepository extends BaseRepository<IAdminArtistReview> implements IAdminArtistReviewRepository {
    constructor();
    findByArtistProfile(artistProfileId: string): Promise<IAdminArtistReview[]>;
    findActiveReview(artistProfileId: string): Promise<IAdminArtistReview | null>;
    findQueue(status?: string, limit?: number): Promise<IAdminArtistReview[]>;
    assign(reviewId: string, adminId: string): Promise<IAdminArtistReview | null>;
    addComment(reviewId: string, authorId: string, text: string, isInternal?: boolean): Promise<IAdminArtistReview | null>;
    updateChecklist(reviewId: string, itemIndex: number, passed: boolean, notes?: string): Promise<IAdminArtistReview | null>;
    resolve(reviewId: string, outcome: IAdminArtistReview['outcome'], notes?: string): Promise<IAdminArtistReview | null>;
}
//# sourceMappingURL=AdminArtistReviewRepository.d.ts.map