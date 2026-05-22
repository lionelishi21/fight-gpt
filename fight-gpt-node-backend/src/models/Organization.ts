import mongoose, { Schema } from 'mongoose';

export interface IOrganization {
    name: string;
    slug: string;           // URL-safe identifier
    game_ids: string[];     // games the org focuses on
    seats: number;          // max player accounts
    members: string[];      // User._id list
    adminId: string;        // User._id of the org admin
    stripeSubscriptionId?: string;
    isActive: boolean;
    createdAt: Date;
}

const schema = new Schema<IOrganization>({
    name:                 { type: String, required: true },
    slug:                 { type: String, required: true, unique: true, index: true },
    game_ids:             [{ type: String }],
    seats:                { type: Number, default: 5 },
    members:              [{ type: String }],
    adminId:              { type: String, required: true },
    stripeSubscriptionId: { type: String },
    isActive:             { type: Boolean, default: true },
    createdAt:            { type: Date, default: Date.now },
}, { timestamps: false });

export const Organization = mongoose.model<IOrganization>('Organization', schema);
