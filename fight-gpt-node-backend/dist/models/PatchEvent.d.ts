import mongoose, { Document } from 'mongoose';
export interface IPatchEvent extends Document {
    game_id: string;
    version: string;
    previous_version: string;
    released_at: Date;
    patch_notes_url?: string;
    changed_characters: string[];
    status: 'pending' | 'ingesting' | 'synthesized';
    created_at: Date;
    updated_at: Date;
}
export declare const PatchEvent: mongoose.Model<IPatchEvent, {}, {}, {}, mongoose.Document<unknown, {}, IPatchEvent, {}, {}> & IPatchEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PatchEvent.d.ts.map