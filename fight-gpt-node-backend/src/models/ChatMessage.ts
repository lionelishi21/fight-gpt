import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    detectedEntities?: any[];
    gameId?: string;
    characterId?: string;
  };
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    metadata: {
      detectedEntities: { type: Array },
      gameId: { type: String },
      characterId: { type: String },
    },
  },
  { timestamps: true }
);

// Index for fast retrieval of conversation history
ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
