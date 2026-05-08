import mongoose, { Document } from 'mongoose';
import { ISplitParty } from './ArtistProfile';
export interface ISplitSheet extends Document {
    artistProfileId: mongoose.Types.ObjectId;
    trackTitle: string;
    isrc?: string;
    trackSubmissionId?: mongoose.Types.ObjectId;
    status: 'draft' | 'pending_signatures' | 'fully_executed' | 'disputed';
    parties: ISplitParty[];
    totalMasterSplit: number;
    totalPublishingSplit: number;
    mechanicalLicenseRequired: boolean;
    mechanicalLicenseStatus?: 'not_required' | 'pending' | 'obtained' | 'compulsory';
    samplesUsed: boolean;
    sampleClearanceStatus?: 'cleared' | 'pending' | 'not_required';
    coverSong: boolean;
    originalSongTitle?: string;
    originalArtist?: string;
    copyrightRegistrationNumber?: string;
    created_at: Date;
    updated_at: Date;
}
export declare const SplitSheet: mongoose.Model<ISplitSheet, {}, {}, {}, mongoose.Document<unknown, {}, ISplitSheet, {}, {}> & ISplitSheet & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SplitSheet.d.ts.map