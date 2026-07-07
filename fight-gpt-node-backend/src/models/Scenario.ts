import mongoose, { Document, Schema } from 'mongoose';

export interface IScenario {
    scenario_id: string;
    game_id: string;
    pro_player_id?: string;
    description: string;
    context: string;
    characters_involved: string[];
    embedding: number[];
    match_references: string[];
    tags: string[];
    // Combined sequences fields
    sequence_chain?: string[];
    tactical_intent?: string;
    // Match state context
    turn_owner?: 'p1' | 'p2' | 'neutral' | 'contested';
    neutral_state?: 'neutral' | 'p1_offense' | 'p2_offense' | 'scramble';
    spacing?: 'throw_range' | 'close' | 'mid_range' | 'max_range' | 'out_of_range' | 'mid' | 'far' | 'corner_p1' | 'corner_p2';
    frame_advantage?: 'p1_plus' | 'p2_plus' | 'even' | 'unknown';
    p1_state?: string;
    p2_state?: string;
    timestamp?: number;
    // Patch version context — critical for coaching accuracy
    // Videos from older patches still contain valid mechanics (spacing, wakeup, neutral)
    // even if specific move data changed. cross_patch_valid marks mechanics that
    // survive patch updates (fundamentals) vs. those that may be stale (frame data).
    patch_version?: string;          // e.g. "2.1", "1.05" — extracted from game metadata at ingest time
    cross_patch_valid?: boolean;     // true = fundamental mechanic unlikely to change across patches
    patch_notes_context?: string;    // brief note on what changed in this patch for these characters
    created_at?: Date;
    updated_at?: Date;
}

export interface IScenarioDocument extends IScenario, Document {
    _id: mongoose.Types.ObjectId;
}

const ScenarioSchema = new Schema<IScenarioDocument>({
    scenario_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    pro_player_id: { type: String, index: true },
    description: { type: String, required: true },
    context: { type: String, required: true },
    characters_involved: [{ type: String }],
    embedding: {
        type: [Number],
        required: true,
    },
    match_references: [{ type: String }],
    tags: [{ type: String }],
    sequence_chain:       [{ type: String }],
    tactical_intent:      { type: String },
    turn_owner:           { type: String },
    neutral_state:        { type: String },
    spacing:              { type: String },
    frame_advantage:      { type: String },
    p1_state:             { type: String },
    p2_state:             { type: String },
    timestamp:            { type: Number },
    patch_version:        { type: String, index: true },
    cross_patch_valid:    { type: Boolean, default: false },
    patch_notes_context:  { type: String },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

ScenarioSchema.index({ game_id: 1, tags: 1 });

export const Scenario = mongoose.model<IScenarioDocument>('Scenario', ScenarioSchema);
