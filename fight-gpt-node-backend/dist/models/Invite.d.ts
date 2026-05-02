import mongoose, { Document } from 'mongoose';
export type InviteType = 'admin_invite' | 'referral';
export type InviteStatus = 'pending' | 'accepted' | 'expired';
export interface IInvite extends Document {
    token: string;
    type: InviteType;
    email?: string;
    invitedById: mongoose.Types.ObjectId;
    invitedByName: string;
    status: InviteStatus;
    acceptedByUserId?: mongoose.Types.ObjectId;
    expiresAt: Date;
    createdAt: Date;
}
export declare const Invite: mongoose.Model<IInvite, {}, {}, {}, mongoose.Document<unknown, {}, IInvite, {}, {}> & IInvite & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Invite.d.ts.map