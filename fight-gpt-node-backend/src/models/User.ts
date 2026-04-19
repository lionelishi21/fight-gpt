import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISlot {
    gameId: string;
    characterId?: string;
    rank?: string;
    notificationsEnabled: boolean;
    proficiencyLevel?: 'newbie' | 'intermediate' | 'pro';
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    location?: {
        country: string;
        city: string;
    };
    onboardingCompleted: boolean;
    tier: 'FREE' | 'COMPETITOR' | 'PRO';
    role: 'user' | 'admin';
    activeSlotIndex: number;
    slots: ISlot[];
    preferences: {
        favoriteGames: string[];
        skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro';
        mainCharacter?: string;
    };
    pushTokens: string[];
    referralCode: string;
    referredBy?: mongoose.Types.ObjectId;
    referralCount: number;
    referralCredits: number;
    gamification: {
        xp: number;
        level: number;
        rank: string;
        stats: {
            defense: number;
            execution: number;
            neutral: number;
            knowledge: number;
            resourceManagement: number;
        };
        heatmap: { date: Date; value: number }[];
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        googleId: { type: String },
        avatar: { type: String },
        stripeCustomerId: { type: String, index: true },
        stripeSubscriptionId: { type: String },
        location: {
            country: { type: String },
            city: { type: String }
        },
        onboardingCompleted: { type: Boolean, default: false },
        tier: {
            type: String,
            enum: ['FREE', 'COMPETITOR', 'PRO'],
            default: 'FREE',
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        activeSlotIndex: { type: Number, default: 0 },
        slots: [
            {
                gameId: { type: String },
                characterId: { type: String },
                rank: { type: String },
                notificationsEnabled: { type: Boolean, default: true },
                proficiencyLevel: {
                    type: String,
                    enum: ['newbie', 'intermediate', 'pro'],
                },
            },
        ],
        preferences: {
            favoriteGames: [{ type: String }],
            skillLevel: {
                type: String,
                enum: ['beginner', 'intermediate', 'advanced', 'pro'],
                default: 'beginner',
            },
            mainCharacter: { type: String },
        },
        pushTokens: [{ type: String }],
        referralCode: { type: String, unique: true, sparse: true },
        referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
        referralCount: { type: Number, default: 0 },
        referralCredits: { type: Number, default: 0 },
        gamification: {
            xp: { type: Number, default: 0 },
            level: { type: Number, default: 1 },
            rank: { type: String, default: 'Rookie' },
            stats: {
                defense: { type: Number, default: 50 },
                execution: { type: Number, default: 50 },
                neutral: { type: Number, default: 50 },
                knowledge: { type: Number, default: 50 },
                resourceManagement: { type: Number, default: 50 },
            },
            heatmap: [{
                date: { type: Date },
                value: { type: Number }
            }]
        },
    },
    { timestamps: true }
);

// Auto-generate referral code on first save
UserSchema.pre<IUser>('save', async function (next) {
    if (this.isNew && !this.referralCode) {
        const { randomBytes } = await import('crypto');
        this.referralCode = randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9C2B1"
    }
    next();
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
