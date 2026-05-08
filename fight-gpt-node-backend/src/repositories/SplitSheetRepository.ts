import { BaseRepository, IBaseRepository } from './BaseRepository';
import { SplitSheet, ISplitSheet } from '../models/SplitSheet';

export interface ISplitSheetRepository extends IBaseRepository<ISplitSheet> {
    findByArtistProfile(artistProfileId: string): Promise<ISplitSheet[]>;
    findByTrack(trackSubmissionId: string): Promise<ISplitSheet | null>;
    findByIsrc(isrc: string): Promise<ISplitSheet | null>;
    updateStatus(splitSheetId: string, status: ISplitSheet['status']): Promise<ISplitSheet | null>;
}

export class SplitSheetRepository
    extends BaseRepository<ISplitSheet>
    implements ISplitSheetRepository
{
    constructor() {
        super(SplitSheet);
    }

    async findByArtistProfile(artistProfileId: string): Promise<ISplitSheet[]> {
        return this.model.find({ artistProfileId })
            .sort({ created_at: -1 })
            .lean().exec() as any;
    }

    async findByTrack(trackSubmissionId: string): Promise<ISplitSheet | null> {
        return this.model.findOne({ trackSubmissionId }).lean().exec() as any;
    }

    async findByIsrc(isrc: string): Promise<ISplitSheet | null> {
        return this.model.findOne({ isrc }).lean().exec() as any;
    }

    async updateStatus(splitSheetId: string, status: ISplitSheet['status']): Promise<ISplitSheet | null> {
        return this.model.findByIdAndUpdate(splitSheetId, { status }, { new: true }).lean().exec() as any;
    }
}
