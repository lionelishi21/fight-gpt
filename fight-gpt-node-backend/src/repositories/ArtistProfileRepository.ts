import { BaseRepository, IBaseRepository } from './BaseRepository';
import { ArtistProfile, IArtistProfile } from '../models/ArtistProfile';

export interface IArtistProfileRepository extends IBaseRepository<IArtistProfile> {
    findByUserId(userId: string): Promise<IArtistProfile | null>;
    findByStatus(status: string, limit?: number, offset?: number): Promise<IArtistProfile[]>;
    countByStatus(status: string): Promise<number>;
    searchArtists(query: string, filters?: Record<string, any>): Promise<IArtistProfile[]>;
    findPendingReview(limit?: number): Promise<IArtistProfile[]>;
    advanceStep(artistProfileId: string, step: number): Promise<IArtistProfile | null>;
}

export class ArtistProfileRepository
    extends BaseRepository<IArtistProfile>
    implements IArtistProfileRepository
{
    constructor() {
        super(ArtistProfile);
    }

    async findByUserId(userId: string): Promise<IArtistProfile | null> {
        return this.findOne({ userId });
    }

    async findByStatus(status: string, limit = 20, offset = 0): Promise<IArtistProfile[]> {
        return this.model.find({ onboardingStatus: status })
            .sort({ submittedAt: 1, created_at: 1 })
            .skip(offset).limit(limit).lean().exec() as any;
    }

    async countByStatus(status: string): Promise<number> {
        return this.model.countDocuments({ onboardingStatus: status });
    }

    async searchArtists(query: string, filters: Record<string, any> = {}): Promise<IArtistProfile[]> {
        const filter: any = { ...filters };
        if (query) {
            filter.$or = [
                { stageName: { $regex: query, $options: 'i' } },
                { legalName: { $regex: query, $options: 'i' } },
            ];
        }
        return this.model.find(filter).sort({ created_at: -1 }).limit(50).lean().exec() as any;
    }

    async findPendingReview(limit = 20): Promise<IArtistProfile[]> {
        return this.model.find({ onboardingStatus: 'pending_review' })
            .sort({ submittedAt: 1 })
            .limit(limit).lean().exec() as any;
    }

    async advanceStep(artistProfileId: string, step: number): Promise<IArtistProfile | null> {
        return this.model.findByIdAndUpdate(
            artistProfileId,
            { $max: { onboardingStep: step } },
            { new: true }
        ).lean().exec() as any;
    }
}
