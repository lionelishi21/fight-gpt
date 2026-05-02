"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
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
    team_mains: [
        {
            game_id: { type: String, required: true },
            point: { type: String, required: true },
            assist1: { type: String, required: true },
            assist2: { type: String, required: true },
            is_active: { type: Boolean, default: true },
        }
    ],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
}, { timestamps: true });
// Auto-generate referral code on first save
UserSchema.pre('save', async function (next) {
    if (this.isNew && !this.referralCode) {
        const { randomBytes } = await Promise.resolve().then(() => __importStar(require('crypto')));
        this.referralCode = randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9C2B1"
    }
    next();
});
// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.default = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map