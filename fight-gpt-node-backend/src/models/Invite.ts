import mongoose, { Schema, Document } from 'mongoose';

export type InviteType = 'admin_invite' | 'referral';
export type InviteStatus = 'pending' | 'accepted' | 'expired';

export interface IInvite extends Document {
    token: string;
    type: InviteType;
    email?: string;                 // pre-filled for admin invites
    invitedById: mongoose.Types.ObjectId;
    invitedByName: string;
    status: InviteStatus;
    acceptedByUserId?: mongoose.Types.ObjectId;
    expiresAt: Date;
    createdAt: Date;
}

const InviteSchema = new Schema<IInvite>(
    {
        token: { type: String, required: true, unique: true, index: true },
        type: { type: String, enum: ['admin_invite', 'referral'], required: true },
        email: { type: String },
        invitedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        invitedByName: { type: String, required: true },
        status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
        acceptedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

export const Invite = mongoose.model<IInvite>('Invite', InviteSchema);
