import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey {
    key: string;           // mp_live_xxxxxxxxxxxxxxxx (shown once, stored hashed)
    keyHash: string;       // sha256 of key for lookup
    prefix: string;        // first 12 chars for display: mp_live_xxxx
    userId: string;
    name: string;          // "My coaching app"
    tier: 'pro' | 'org';   // pro = 100 req/h, org = 1000 req/h
    requestsThisHour: number;
    hourWindowStart: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    createdAt: Date;
}

const schema = new Schema<IApiKey>({
    key:              { type: String },                          // never persisted after creation
    keyHash:          { type: String, required: true, unique: true, index: true },
    prefix:           { type: String, required: true },
    userId:           { type: String, required: true, index: true },
    name:             { type: String, required: true },
    tier:             { type: String, enum: ['pro', 'org'], default: 'pro' },
    requestsThisHour: { type: Number, default: 0 },
    hourWindowStart:  { type: Date, default: Date.now },
    lastUsedAt:       { type: Date },
    isActive:         { type: Boolean, default: true },
    createdAt:        { type: Date, default: Date.now },
}, { timestamps: false });

export const RATE_LIMITS: Record<string, number> = { pro: 100, org: 1000 };

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
    const raw    = `mp_live_${crypto.randomBytes(24).toString('hex')}`;
    const hash   = crypto.createHash('sha256').update(raw).digest('hex');
    const prefix = raw.slice(0, 16);
    return { raw, hash, prefix };
}

export const ApiKey = mongoose.model<IApiKey>('ApiKey', schema);
