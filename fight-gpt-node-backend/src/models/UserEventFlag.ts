import mongoose, { Schema, Document } from 'mongoose';

export type FlagReason = 'wrong_move' | 'wrong_outcome' | 'wrong_event_type' | 'didnt_happen' | 'missing_event' | 'other';

export interface IUserEventFlag extends Document {
    analysis_id: string;
    event_node_id: string;
    timestamp: string;
    game_id: string;
    reason: FlagReason;
    note?: string;
    user_id: string;
    created_at: Date;
}

const schema = new Schema<IUserEventFlag>({
    analysis_id:  { type: String, required: true, index: true },
    event_node_id:{ type: String, required: true },
    timestamp:    { type: String, default: '' },
    game_id:      { type: String, required: true, index: true },
    reason:       { type: String, enum: ['wrong_move','wrong_outcome','wrong_event_type','didnt_happen','missing_event','other'], required: true },
    note:         { type: String, maxlength: 500 },
    user_id:      { type: String, required: true },
    created_at:   { type: Date, default: Date.now },
}, { timestamps: false });

// Prevent one user flagging the same event twice
schema.index({ analysis_id: 1, event_node_id: 1, user_id: 1 }, { unique: true });

export const UserEventFlag = mongoose.model<IUserEventFlag>('UserEventFlag', schema);
