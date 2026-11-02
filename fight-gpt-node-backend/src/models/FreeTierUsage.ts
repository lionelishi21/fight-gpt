import mongoose, { Schema, Document } from 'mongoose';

/** Daily free-tier usage of Character GPT, per user (or per IP for signed-out visitors). */
export interface IFreeTierUsage extends Document {
    key: string;        // "user:<id>" or "ip:<address>"
    date: string;       // the period counted: YYYY-MM-DD (UTC) or YYYY-Www (ISO week)
    character: string;  // the one character a free user may train with that day
    count: number;      // messages sent that day
    createdAt: Date;
}

const FreeTierUsageSchema = new Schema<IFreeTierUsage>({
    key: { type: String, required: true },
    date: { type: String, required: true },
    character: { type: String, required: true },
    count: { type: Number, default: 0 },
    // Mongo drops old rows on its own; kept past a week so weekly limits hold
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 8 },
});

FreeTierUsageSchema.index({ key: 1, date: 1 }, { unique: true });

export default mongoose.model<IFreeTierUsage>('FreeTierUsage', FreeTierUsageSchema);
