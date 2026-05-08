import { BaseRepository, IBaseRepository } from './BaseRepository';
import { TrackSubmission, ITrackSubmission } from '../models/TrackSubmission';

export interface ITrackSubmissionRepository extends IBaseRepository<ITrackSubmission> {
    findByArtistProfile(artistProfileId: string, status?: string): Promise<ITrackSubmission[]>;
    findPendingReview(limit?: number): Promise<ITrackSubmission[]>;
    updateStatus(trackId: string, status: ITrackSubmission['status'], reviewedBy: string, rejectionReason?: string): Promise<ITrackSubmission | null>;
    setLive(trackId: string): Promise<ITrackSubmission | null>;
    updateFingerprintStatus(trackId: string, status: ITrackSubmission['fingerprintStatus'], details?: string): Promise<ITrackSubmission | null>;
}

export class TrackSubmissionRepository
    extends BaseRepository<ITrackSubmission>
    implements ITrackSubmissionRepository
{
    constructor() {
        super(TrackSubmission);
    }

    async findByArtistProfile(artistProfileId: string, status?: string): Promise<ITrackSubmission[]> {
        const filter: any = { artistProfileId };
        if (status) filter.status = status;
        return this.model.find(filter)
            .sort({ created_at: -1 })
            .lean().exec() as any;
    }

    async findPendingReview(limit = 20): Promise<ITrackSubmission[]> {
        return this.model.find({ status: 'under_review' })
            .sort({ submittedAt: 1 })
            .limit(limit).lean().exec() as any;
    }

    async updateStatus(
        trackId: string,
        status: ITrackSubmission['status'],
        reviewedBy: string,
        rejectionReason?: string
    ): Promise<ITrackSubmission | null> {
        const update: any = { status, reviewedBy };
        if (status === 'approved') update.approvedAt = new Date();
        if (status === 'live') update.liveAt = new Date();
        if (rejectionReason) update.rejectionReason = rejectionReason;
        return this.model.findByIdAndUpdate(trackId, update, { new: true }).lean().exec() as any;
    }

    async setLive(trackId: string): Promise<ITrackSubmission | null> {
        return this.model.findByIdAndUpdate(
            trackId,
            { status: 'live', liveAt: new Date() },
            { new: true }
        ).lean().exec() as any;
    }

    async updateFingerprintStatus(
        trackId: string,
        status: ITrackSubmission['fingerprintStatus'],
        details?: string
    ): Promise<ITrackSubmission | null> {
        const update: any = { fingerprintStatus: status };
        if (details) update.fingerprintMatchDetails = details;
        return this.model.findByIdAndUpdate(trackId, update, { new: true }).lean().exec() as any;
    }
}
