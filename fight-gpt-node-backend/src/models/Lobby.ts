import mongoose, { Schema, Document } from 'mongoose';

export interface ILobby extends Document {
    game_id: string; // SF6, TEKKEN8, or 'GLOBAL'
    name: string;
    description?: string;
    active_users: number;
    createdAt: Date;
    updatedAt: Date;
}

const LobbySchema: Schema = new Schema(
    {
        game_id: { type: String, required: true, index: true },
        name: { type: String, required: true },
        description: { type: String },
        active_users: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model<ILobby>('Lobby', LobbySchema);
