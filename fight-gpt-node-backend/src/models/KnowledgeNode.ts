import mongoose, { Document, Schema } from 'mongoose';

export type KnowledgeType = 'frame_data' | 'patch_note' | 'wiki_strategy' | 'discord_tech';

export interface IKnowledgeNode {
    node_id: string;
    game_id: string;
    character_id?: string;
    type: KnowledgeType;
    content: string;
    source_url?: string;
    version?: string;
    embedding?: number[];
    created_at: Date;
}

export interface IKnowledgeNodeDocument extends IKnowledgeNode, Document {}

const KnowledgeNodeSchema = new Schema<IKnowledgeNodeDocument>({
    node_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    character_id: { type: String, index: true }, // Optional, can be null for general game mechanics
    type: { type: String, required: true, enum: ['frame_data', 'patch_note', 'wiki_strategy', 'discord_tech'] },
    content: { type: String, required: true },
    source_url: { type: String },
    version: { type: String },
    embedding: { type: [Number], required: false, select: false }, // Explicitly deselect to save memory unless requested
    created_at: { type: Date, default: Date.now }
});

export const KnowledgeNode = mongoose.model<IKnowledgeNodeDocument>('KnowledgeNode', KnowledgeNodeSchema);
