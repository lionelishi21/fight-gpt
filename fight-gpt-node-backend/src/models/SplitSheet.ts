import mongoose, { Document, Schema } from 'mongoose';
import { ISplitParty } from './ArtistProfile';

const EmbeddedSplitPartySchema = new Schema({
    name:            { type: String, required: true },
    email:           { type: String },
    role:            { type: String, enum: ['composer','lyricist','producer','performer','publisher','co_writer'], required: true },
    ipiNumber:       { type: String },
    proAffiliation:  { type: String },
    masterSplit:     { type: Number, required: true, min: 0, max: 100 },
    publishingSplit: { type: Number, required: true, min: 0, max: 100 },
    acceptedAt:      { type: Date },
}, { _id: false });

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

const SplitSheetSchema = new Schema({
    artistProfileId:          { type: Schema.Types.ObjectId, ref: 'ArtistProfile', required: true, index: true },
    trackTitle:               { type: String, required: true },
    isrc:                     { type: String, index: true, sparse: true },
    trackSubmissionId:        { type: Schema.Types.ObjectId, ref: 'TrackSubmission' },
    status:                   { type: String, enum: ['draft','pending_signatures','fully_executed','disputed'], default: 'draft', index: true },
    parties:                  { type: [EmbeddedSplitPartySchema], required: true },
    totalMasterSplit:         { type: Number, default: 100 },
    totalPublishingSplit:     { type: Number, default: 100 },
    mechanicalLicenseRequired:{ type: Boolean, default: false },
    mechanicalLicenseStatus:  { type: String, enum: ['not_required','pending','obtained','compulsory'] },
    samplesUsed:              { type: Boolean, default: false },
    sampleClearanceStatus:    { type: String, enum: ['cleared','pending','not_required'] },
    coverSong:                { type: Boolean, default: false },
    originalSongTitle:        { type: String },
    originalArtist:           { type: String },
    copyrightRegistrationNumber: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const SplitSheet = mongoose.model<ISplitSheet>('SplitSheet', SplitSheetSchema);
