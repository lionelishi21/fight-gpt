import mongoose, { Document, Schema } from 'mongoose';

export interface IScenario {
    scenario_id: string;
    game_id: string;
    description: string;
    context: string;
    characters_involved: string[];
    embedding: number[];
    match_references: string[];
    tags: string[];
    // Match state context — populated by AI analysis
    turn_owner?: 'p1' | 'p2' | 'neutral' | 'contested';
    neutral_state?: 'neutral' | 'p1_offense' | 'p2_offense' | 'scramble';
    spacing?: 'close' | 'mid' | 'far' | 'corner_p1' | 'corner_p2';
    frame_advantage?: 'p1_plus' | 'p2_plus' | 'even' | 'unknown';
    p1_state?: string;
    p2_state?: string;
    timestamp?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface IScenarioDocument extends IScenario, Document {
    _id: mongoose.Types.ObjectId;
}

const ScenarioSchema = new Schema<IScenarioDocument>({
    scenario_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    description: { type: String, required: true },
    context: { type: String, required: true },
    characters_involved: [{ type: String }],
    embedding: {
        type: [Number],
        required: true,
        // Note: To use Atlas Vector Search, an Atlas Search index must be created via the UI or Atlas API
        // configuring the 'embedding' field as a vector.
    },
    match_references: [{ type: String }],
    tags: [{ type: String }],
    turn_owner:      { type: String },
    neutral_state:   { type: String },
    spacing:         { type: String },
    frame_advantage: { type: String },
    p1_state:        { type: String },
    p2_state:        { type: String },
    timestamp:       { type: Number },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

ScenarioSchema.index({ game_id: 1, tags: 1 });

export const Scenario = mongoose.model<IScenarioDocument>('Scenario', ScenarioSchema);
