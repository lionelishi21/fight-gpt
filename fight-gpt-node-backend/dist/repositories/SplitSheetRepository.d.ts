import { BaseRepository, IBaseRepository } from './BaseRepository';
import { ISplitSheet } from '../models/SplitSheet';
export interface ISplitSheetRepository extends IBaseRepository<ISplitSheet> {
    findByArtistProfile(artistProfileId: string): Promise<ISplitSheet[]>;
    findByTrack(trackSubmissionId: string): Promise<ISplitSheet | null>;
    findByIsrc(isrc: string): Promise<ISplitSheet | null>;
    updateStatus(splitSheetId: string, status: ISplitSheet['status']): Promise<ISplitSheet | null>;
}
export declare class SplitSheetRepository extends BaseRepository<ISplitSheet> implements ISplitSheetRepository {
    constructor();
    findByArtistProfile(artistProfileId: string): Promise<ISplitSheet[]>;
    findByTrack(trackSubmissionId: string): Promise<ISplitSheet | null>;
    findByIsrc(isrc: string): Promise<ISplitSheet | null>;
    updateStatus(splitSheetId: string, status: ISplitSheet['status']): Promise<ISplitSheet | null>;
}
//# sourceMappingURL=SplitSheetRepository.d.ts.map