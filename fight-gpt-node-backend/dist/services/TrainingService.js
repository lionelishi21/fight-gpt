"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingService = void 0;
const Mission_1 = __importDefault(require("../models/Mission"));
const UserMission_1 = __importDefault(require("../models/UserMission"));
const GamificationService_1 = require("./GamificationService");
class TrainingService {
    gamificationService;
    constructor() {
        this.gamificationService = new GamificationService_1.GamificationService();
    }
    /**
     * Get missions for a user (Daily rotation + their status)
     * For this MVP, we return all active missions or a random subset.
     */
    async getMissionsForUser(userId) {
        // 1. Fetch available active missions
        // In a real daily system, we'd pick 3 based on date/seed
        const availableMissions = await Mission_1.default.find({ isActive: true }).limit(5);
        // 2. Fetch user's progress for these missions
        const userMissions = await UserMission_1.default.find({
            user: userId,
            mission: { $in: availableMissions.map((m) => m._id) },
        });
        // 3. Merge data
        return availableMissions.map((mission) => {
            const userEntry = userMissions.find(
            // @ts-ignore
            (um) => um.mission.toString() === mission._id.toString());
            return {
                id: mission._id,
                title: mission.title,
                description: mission.description,
                type: mission.type,
                difficulty: mission.difficulty,
                reward: `${mission.reward.xp} XP`, // Formatting for UI
                rewardValue: mission.reward.xp,
                targetLink: mission.targetLink,
                status: userEntry ? userEntry.status : 'AVAILABLE', // AVAILABLE means not started/tracked yet
                completed: userEntry?.status === 'COMPLETED',
            };
        });
    }
    /**
     * Complete a mission manually (e.g. user clicks "Claim" or "I did this")
     */
    async completeMission(userId, missionId) {
        // 1. Validate mission
        const mission = await Mission_1.default.findById(missionId);
        if (!mission)
            throw new Error('Mission not found');
        // 2. Check if already completed
        let userMission = await UserMission_1.default.findOne({ user: userId, mission: missionId });
        if (userMission && userMission.status === 'COMPLETED') {
            throw new Error('Mission already completed');
        }
        // 3. Create or Update UserMission
        if (!userMission) {
            userMission = new UserMission_1.default({
                user: userId,
                mission: missionId,
                status: 'COMPLETED',
                completedAt: new Date(),
            });
        }
        else {
            userMission.status = 'COMPLETED';
            userMission.completedAt = new Date();
        }
        await userMission.save();
        // 4. Award XP using GamificationService
        const rewardXp = mission.reward.xp;
        await this.gamificationService.addXp(userId, rewardXp);
        return {
            success: true,
            missionId,
            status: 'COMPLETED',
            rewardedXp: rewardXp,
        };
    }
}
exports.TrainingService = TrainingService;
//# sourceMappingURL=TrainingService.js.map