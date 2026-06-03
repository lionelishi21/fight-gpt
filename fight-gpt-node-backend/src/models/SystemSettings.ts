import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings {
    active_ai_provider: 'gemini' | 'grok';
    grok_fallback_enabled: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface ISystemSettingsDocument extends ISystemSettings, Document {
    _id: mongoose.Types.ObjectId;
}

const SystemSettingsSchema = new Schema<ISystemSettingsDocument>({
    active_ai_provider: {
        type: String,
        enum: ['gemini', 'grok'],
        default: 'gemini',
        required: true
    },
    grok_fallback_enabled: {
        type: Boolean,
        default: true,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Singleton helper to get settings, creating defaults if not exists
SystemSettingsSchema.statics.getSettings = async function(): Promise<ISystemSettingsDocument> {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            active_ai_provider: 'gemini',
            grok_fallback_enabled: true
        });
    }
    return settings;
};

export interface ISystemSettingsModel extends mongoose.Model<ISystemSettingsDocument> {
    getSettings(): Promise<ISystemSettingsDocument>;
}

export const SystemSettings = mongoose.model<ISystemSettingsDocument, ISystemSettingsModel>('SystemSettings', SystemSettingsSchema);
