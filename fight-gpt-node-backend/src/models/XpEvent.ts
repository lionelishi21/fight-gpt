import mongoose, { Schema, Document } from 'mongoose';

/** Ledger of XP awards. The unique index makes each award idempotent per source. */
export interface IXpEvent extends Document {
    user: mongoose.Types.ObjectId;
    source: string;     // 'mission' | 'analysis' | 'referral'
    sourceId: string;   // the mission, analysis or referred user it was for
    amount: number;
    createdAt: Date;
}

const XpEventSchema = new Schema<IXpEvent>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, required: true },
    sourceId: { type: String, required: true },
    amount: { type: Number, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

XpEventSchema.index({ user: 1, source: 1, sourceId: 1 }, { unique: true });

export default mongoose.model<IXpEvent>('XpEvent', XpEventSchema);
