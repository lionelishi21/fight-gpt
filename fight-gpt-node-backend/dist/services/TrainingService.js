"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingService = void 0;
const Mission_1 = __importDefault(require("../models/Mission"));
const UserMission_1 = __importDefault(require("../models/UserMission"));
const mongoose_1 = __importDefault(require("mongoose"));
class TrainingService {
    /**
     * Parse an analysis and generate personalized training drills (Missions)
     */
    async generateDrillsFromAnalysis(analysis) {
        if (!analysis.user_id || !analysis.analysis)
            return;
        const { timeline, daily_mission, p2_character } = analysis.analysis;
        const userId = new mongoose_1.default.Types.ObjectId(analysis.user_id);
        // 1. Process Daily Mission if present
        if (daily_mission) {
            await this.createMissionFromAI(userId, daily_mission, analysis.analysis_id);
        }
        // 2. Process Timeline for missed punishes or bad habits
        if (timeline && timeline.length > 0) {
            const mistakes = timeline.filter(e => e.event_type === 'punish_missed' || e.event_type === 'bad_habit');
            // Take top 2 mistakes to avoid overwhelming the user
            for (const mistake of mistakes.slice(0, 2)) {
                await this.createMissionFromMistake(userId, mistake, p2_character || 'Opponent', analysis.analysis_id);
            }
        }
    }
    async createMissionFromAI(userId, aiMission, analysisId) {
        try {
            const mission = await Mission_1.default.create({
                title: aiMission.title.toUpperCase(),
                description: aiMission.goal,
                type: 'DRILL',
                difficulty: 'MEDIUM',
                reward: { xp: 150 },
                criteria: { steps: aiMission.drill_steps, analysisId }
            });
            await UserMission_1.default.create({
                user: userId,
                mission: mission._id,
                status: 'PENDING'
            });
        }
        catch (e) {
            console.error('TRAINING_SERVICE: Failed to create AI mission', e);
        }
    }
    async createMissionFromMistake(userId, mistake, opponent, analysisId) {
        try {
            const title = `COUNTER_${opponent.toUpperCase()}_TACTIC`;
            // Check if user already has a pending mission with this title
            const existing = await UserMission_1.default.findOne({
                user: userId,
                status: 'PENDING'
            }).populate({
                path: 'mission',
                match: { title }
            });
            if (existing && existing.mission)
                return;
            const mission = await Mission_1.default.create({
                title,
                description: mistake.coach_advice,
                type: 'DRILL',
                difficulty: 'EASY',
                reward: { xp: 100 },
                criteria: { eventType: mistake.event_type, description: mistake.description, analysisId }
            });
            await UserMission_1.default.create({
                user: userId,
                mission: mission._id,
                status: 'PENDING'
            });
        }
        catch (e) {
            console.error('TRAINING_SERVICE: Failed to create mistake mission', e);
        }
    }
    /**
     * Get all active and completed missions for a user
     */
    async getMissionsForUser(userId) {
        return await UserMission_1.default.find({ user: userId })
            .populate('mission')
            .sort({ createdAt: -1 });
    }
    /**
     * Manually complete a mission and award XP
     */
    async completeMission(userId, userMissionId) {
        const userMission = await UserMission_1.default.findOne({ _id: userMissionId, user: userId }).populate('mission');
        if (!userMission)
            throw new Error('Mission not found');
        if (userMission.status === 'COMPLETED')
            return userMission;
        userMission.status = 'COMPLETED';
        userMission.completedAt = new Date();
        await userMission.save();
        // Award XP
        const mission = userMission.mission;
        const xpToAdd = mission.reward?.xp || 100;
        const User = mongoose_1.default.model('User');
        const user = await User.findById(userId);
        if (user) {
            const currentXp = user.gamification.xp || 0;
            const newXp = currentXp + xpToAdd;
            user.gamification.xp = newXp;
            // Level up every 1000 XP
            user.gamification.level = Math.floor(newXp / 1000) + 1;
            await user.save();
        }
        return userMission;
    }
    /**
     * Submit video proof (links to a new analysis)
     */
    async submitProof(userId, userMissionId, proofUrl) {
        const userMission = await UserMission_1.default.findOne({ _id: userMissionId, user: userId });
        if (!userMission)
            throw new Error('Mission not found');
        userMission.metadata = { ...userMission.metadata, proofUrl };
        await userMission.save();
        return { success: true, message: 'Proof submitted for tactical review' };
    }
}
exports.TrainingService = TrainingService;
exports.default = new TrainingService();
//# sourceMappingURL=TrainingService.js.map