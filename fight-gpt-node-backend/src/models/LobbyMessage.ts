import mongoose, { Schema, Document } from 'mongoose';

export interface ILobbyMessage extends Document {
    lobby_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    content: string;
    intel_link?: {
        type: 'analysis' | 'theory' | 'scenario';
        id: string;
        title: string;
    };
    createdAt: Date;
}

const LobbyMessageSchema: Schema = new Schema(
    {
        lobby_id: { type: Schema.Types.ObjectId, ref: 'Lobby', required: true, index: true },
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        intel_link: {
            type: { type: String, enum: ['analysis', 'theory', 'scenario'] },
            id: { type: String },
            title: { type: String },
        },
    },
    { timestamps: true }
);

// Index for fast retrieval of lobby history
LobbyMessageSchema.index({ lobby_id: 1, createdAt: -1 });

export default mongoose.model<ILobbyMessage>('LobbyMessage', LobbyMessageSchema);
