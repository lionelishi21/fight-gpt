import mongoose, { Document, Schema } from 'mongoose';

export interface IScenario {
    scenario_id: string;
    game_id: string;
    description: string;
    context: string;
    characters_involved: string[];
    embedding: number[]; // e.g. 768-dim from Gemini or 1536-dim from OpenAI
    match_references: string[]; // Array of match_ids that demonstrate this scenario
    tags: string[];
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
    tags: [{ type: String }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

ScenarioSchema.index({ game_id: 1, tags: 1 });

export const Scenario = mongoose.model<IScenarioDocument>('Scenario', ScenarioSchema);
