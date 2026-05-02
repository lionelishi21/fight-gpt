import mongoose, { Document, Types } from 'mongoose';
export interface ISlot {
    gameId: string;
    characterId?: string;
    rank?: string;
    notificationsEnabled: boolean;
    proficiencyLevel?: 'newbie' | 'intermediate' | 'pro';
}
export interface ITeamMain {
    game_id: string;
    point: string;
    assist1: string;
    assist2: string;
    is_active: boolean;
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
    team_mains: ITeamMain[];
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
        heatmap: {
            date: Date;
            value: number;
        }[];
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map