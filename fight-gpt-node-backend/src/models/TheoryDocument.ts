import mongoose, { Document, Schema } from 'mongoose';

export type TheoryType = 'character' | 'matchup' | 'meta';
export type SkillLevel = 'Rookie' | 'Intermediate' | 'Pro';

export interface ITheoryDocument {
    theory_id: string;
    game_id: string;
    type: TheoryType;
    target_skill_level: SkillLevel;

    // For character theory
    character_id?: string;
    character_name?: string;

    // For matchup theory
    character_a?: string;
    character_b?: string;

    title: string;
    summary: string;         // 1-2 sentence TL;DR
    full_theory: string;     // Gemini-generated long-form theory

    // Structured intelligence
    key_strengths: string[];
    key_weaknesses: string[];
    win_conditions: string[];
    counterplay: string[];

    // Data quality
    source_scenario_count: number;
    confidence: 'low' | 'medium' | 'high'; // based on scenario count

    // Patch versioning
    patch_version?: string;
    is_current_patch: boolean;
    vortex_graph?: {
        nodes: Array<{ id: string; label: string; description: string; type: 'neutral' | 'pressure' | 'finisher' | 'reset' }>;
        edges: Array<{ source: string; target: string; label?: string }>;
    };

    generated_at: Date;
    created_at?: Date;
    updated_at?: Date;
    status: 'pending' | 'approved' | 'rejected';
}

export interface ITheoryDocumentDocument extends ITheoryDocument, Document {
    _id: mongoose.Types.ObjectId;
}

const TheoryDocumentSchema = new Schema<ITheoryDocumentDocument>({
    theory_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    type: { type: String, enum: ['character', 'matchup', 'meta'], required: true },
    target_skill_level: { type: String, enum: ['Rookie', 'Intermediate', 'Pro'], default: 'Intermediate', index: true },

    character_id: { type: String, index: true },
    character_name: { type: String },

    character_a: { type: String },
    character_b: { type: String },

    title: { type: String, required: true },
    summary: { type: String, required: true },
    full_theory: { type: String, required: true },

    key_strengths: [{ type: String }],
    key_weaknesses: [{ type: String }],
    win_conditions: [{ type: String }],
    counterplay: [{ type: String }],

    source_scenario_count: { type: Number, default: 0 },
    confidence: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

    patch_version: { type: String, index: true },
    is_current_patch: { type: Boolean, default: true, index: true },
    vortex_graph: {
        nodes: [{
            id: String,
            label: String,
            description: String,
            type: { type: String, enum: ['neutral', 'pressure', 'finisher', 'reset'] }
        }],
        edges: [{
            source: String,
            target: String,
            label: String
        }]
    },

    generated_at: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Update indexes to include skill level
TheoryDocumentSchema.index({ game_id: 1, character_id: 1, target_skill_level: 1, is_current_patch: 1 });
TheoryDocumentSchema.index({ game_id: 1, character_a: 1, character_b: 1, target_skill_level: 1, is_current_patch: 1 });
TheoryDocumentSchema.index({ game_id: 1, type: 1, target_skill_level: 1, patch_version: 1 });

export const TheoryDoc = mongoose.model<ITheoryDocumentDocument>('TheoryDocument', TheoryDocumentSchema);
