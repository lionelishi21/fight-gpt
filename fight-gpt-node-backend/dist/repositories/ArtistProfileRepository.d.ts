import { BaseRepository, IBaseRepository } from './BaseRepository';
import { IArtistProfile } from '../models/ArtistProfile';
export interface IArtistProfileRepository extends IBaseRepository<IArtistProfile> {
    findByUserId(userId: string): Promise<IArtistProfile | null>;
    findByStatus(status: string, limit?: number, offset?: number): Promise<IArtistProfile[]>;
    countByStatus(status: string): Promise<number>;
    searchArtists(query: string, filters?: Record<string, any>): Promise<IArtistProfile[]>;
    findPendingReview(limit?: number): Promise<IArtistProfile[]>;
    advanceStep(artistProfileId: string, step: number): Promise<IArtistProfile | null>;
}
export declare class ArtistProfileRepository extends BaseRepository<IArtistProfile> implements IArtistProfileRepository {
    constructor();
    findByUserId(userId: string): Promise<IArtistProfile | null>;
    findByStatus(status: string, limit?: number, offset?: number): Promise<IArtistProfile[]>;
    countByStatus(status: string): Promise<number>;
    searchArtists(query: string, filters?: Record<string, any>): Promise<IArtistProfile[]>;
    findPendingReview(limit?: number): Promise<IArtistProfile[]>;
    advanceStep(artistProfileId: string, step: number): Promise<IArtistProfile | null>;
}
//# sourceMappingURL=ArtistProfileRepository.d.ts.map