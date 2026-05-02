import mongoose, { Document, Schema } from 'mongoose';

export interface IPatchEvent extends Document {
    game_id: string;
    version: string;
    previous_version: string;
    released_at: Date;
    patch_notes_url?: string;
    changed_characters: string[];    // character slugs affected by this patch
    status: 'pending' | 'ingesting' | 'synthesized';
    created_at: Date;
    updated_at: Date;
}

const PatchEventSchema = new Schema(
    {
        game_id:            { type: String, required: true, index: true },
        version:            { type: String, required: true },
        previous_version:   { type: String, required: true, default: '' },
        released_at:        { type: Date,   required: true, default: Date.now },
        patch_notes_url:    { type: String },
        changed_characters: { type: [String], default: [] },
        status: {
            type: String,
            enum: ['pending', 'ingesting', 'synthesized'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

PatchEventSchema.index({ game_id: 1, version: 1 }, { unique: true });

export const PatchEvent = mongoose.model<IPatchEvent>('PatchEvent', PatchEventSchema);
