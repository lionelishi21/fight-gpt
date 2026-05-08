import { BaseRepository, IBaseRepository } from './BaseRepository';
import { ITrackSubmission } from '../models/TrackSubmission';
export interface ITrackSubmissionRepository extends IBaseRepository<ITrackSubmission> {
    findByArtistProfile(artistProfileId: string, status?: string): Promise<ITrackSubmission[]>;
    findPendingReview(limit?: number): Promise<ITrackSubmission[]>;
    updateStatus(trackId: string, status: ITrackSubmission['status'], reviewedBy: string, rejectionReason?: string): Promise<ITrackSubmission | null>;
    setLive(trackId: string): Promise<ITrackSubmission | null>;
    updateFingerprintStatus(trackId: string, status: ITrackSubmission['fingerprintStatus'], details?: string): Promise<ITrackSubmission | null>;
}
export declare class TrackSubmissionRepository extends BaseRepository<ITrackSubmission> implements ITrackSubmissionRepository {
    constructor();
    findByArtistProfile(artistProfileId: string, status?: string): Promise<ITrackSubmission[]>;
    findPendingReview(limit?: number): Promise<ITrackSubmission[]>;
    updateStatus(trackId: string, status: ITrackSubmission['status'], reviewedBy: string, rejectionReason?: string): Promise<ITrackSubmission | null>;
    setLive(trackId: string): Promise<ITrackSubmission | null>;
    updateFingerprintStatus(trackId: string, status: ITrackSubmission['fingerprintStatus'], details?: string): Promise<ITrackSubmission | null>;
}
//# sourceMappingURL=TrackSubmissionRepository.d.ts.map