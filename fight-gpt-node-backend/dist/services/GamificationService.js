"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
const User_1 = __importDefault(require("../models/User"));
class GamificationService {
    /**
     * Calculate level based on total XP
     * Formula: Level = floor(sqrt(XP / 100)) + 1
     * Example:
     * 0 XP = Level 1
     * 100 XP = Level 2
     * 400 XP = Level 3
     * 900 XP = Level 4
     */
    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }
    /**
     * Calculate XP required for next level
     */
    calculateNextLevelXp(currentLevel) {
        return Math.pow(currentLevel, 2) * 100;
    }
    /**
     * Get user gamification stats
     */
    async getUserStats(userId) {
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new Error('User not found');
        // Initialize gamification if missing (migration)
        if (!user.gamification) {
            user.gamification = {
                xp: 0,
                level: 1,
                rank: 'Rookie',
                stats: {
                    defense: 50,
                    execution: 50,
                    neutral: 50,
                    knowledge: 50,
                    resourceManagement: 50
                },
                heatmap: []
            };
            await user.save();
        }
        const nextLevelXp = this.calculateNextLevelXp(user.gamification.level);
        return {
            ...user.gamification,
            nextLevelXp
        };
    }
    /**
     * Add XP to user and handle level up
     */
    async addXp(userId, amount) {
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new Error('User not found');
        // Ensure gamification object exists
        if (!user.gamification) {
            // @ts-ignore
            user.gamification = {};
        }
        const currentXp = user.gamification.xp || 0;
        const newXp = currentXp + amount;
        const newLevel = this.calculateLevel(newXp);
        user.gamification.xp = newXp;
        user.gamification.level = newLevel;
        // Update rank based on level
        if (newLevel < 5)
            user.gamification.rank = 'Rookie';
        else if (newLevel < 10)
            user.gamification.rank = 'Bronze';
        else if (newLevel < 20)
            user.gamification.rank = 'Silver';
        else if (newLevel < 30)
            user.gamification.rank = 'Gold';
        else if (newLevel < 40)
            user.gamification.rank = 'Platinum';
        else if (newLevel < 50)
            user.gamification.rank = 'Diamond';
        else
            user.gamification.rank = 'Master';
        // Record activity in heatmap
        await this.recordActivity(user);
        await user.save();
        return user.gamification;
    }
    /**
     * Update user fighting stats (e.g. after analysis)
     */
    async updateStats(userId, newStats) {
        const user = await User_1.default.findById(userId);
        if (!user)
            throw new Error('User not found');
        if (!user.gamification.stats) {
            user.gamification.stats = {
                defense: 50,
                execution: 50,
                neutral: 50,
                knowledge: 50,
                resourceManagement: 50
            };
        }
        user.gamification.stats = {
            ...user.gamification.stats,
            ...newStats
        };
        await user.save();
        return user.gamification.stats;
    }
    /**
     * Internal: Record activity for heatmap
     */
    async recordActivity(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!user.gamification.heatmap) {
            user.gamification.heatmap = [];
        }
        const existingEntry = user.gamification.heatmap.find(h => new Date(h.date).getTime() === today.getTime());
        if (existingEntry) {
            existingEntry.value += 1;
        }
        else {
            user.gamification.heatmap.push({ date: today, value: 1 });
            // Keep only last 365 days
            if (user.gamification.heatmap.length > 365) {
                user.gamification.heatmap.shift();
            }
        }
    }
}
exports.GamificationService = GamificationService;
//# sourceMappingURL=GamificationService.js.map