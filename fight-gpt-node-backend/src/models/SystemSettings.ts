import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings {
    monthly_global_limit: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface ISystemSettingsDocument extends ISystemSettings, Document {
    _id: mongoose.Types.ObjectId;
}

const SystemSettingsSchema = new Schema<ISystemSettingsDocument>({
    monthly_global_limit: {
        type: Number,
        default: 1000,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

SystemSettingsSchema.statics.getSettings = async function(): Promise<ISystemSettingsDocument> {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ monthly_global_limit: 1000 });
    }
    return settings;
};

export interface ISystemSettingsModel extends mongoose.Model<ISystemSettingsDocument> {
    getSettings(): Promise<ISystemSettingsDocument>;
}

export const SystemSettings = mongoose.model<ISystemSettingsDocument, ISystemSettingsModel>('SystemSettings', SystemSettingsSchema);
