import Mission, { IMission } from '../models/Mission';
import UserMission, { IUserMission } from '../models/UserMission';
import { GamificationService } from './GamificationService';

export class TrainingService {
    private gamificationService: GamificationService;

    constructor() {
        this.gamificationService = new GamificationService();
    }

    /**
     * Get missions for a user (Daily rotation + their status)
     * For this MVP, we return all active missions or a random subset.
     */
    public async getMissionsForUser(userId: string) {
        // 1. Fetch available active missions
        // In a real daily system, we'd pick 3 based on date/seed
        const availableMissions = await Mission.find({ isActive: true }).limit(5);

        // 2. Fetch user's progress for these missions
        const userMissions = await UserMission.find({
            user: userId,
            mission: { $in: availableMissions.map((m) => m._id) },
        });

        // 3. Merge data
        return availableMissions.map((mission) => {
            const userEntry = userMissions.find(
                // @ts-ignore
                (um) => um.mission.toString() === mission._id.toString()
            );

            return {
                id: mission._id,
                title: mission.title,
                description: mission.description,
                type: mission.type,
                difficulty: mission.difficulty,
                reward: `${mission.reward.xp} XP`, // Formatting for UI
                rewardValue: mission.reward.xp,
                targetLink: mission.targetLink,
                status: userEntry ? userEntry.status : 'AVAILABLE',
                completed: userEntry?.status === 'COMPLETED',
                feedback: userEntry?.metadata?.ai_feedback,
                score: userEntry?.metadata?.technique_score
            };
        });
    }

    /**
     * Complete a mission manually (e.g. user clicks "Claim" or "I did this")
     */
    public async completeMission(userId: string, missionId: string) {
        // 1. Validate mission
        const mission = await Mission.findById(missionId);
        if (!mission) throw new Error('Mission not found');

        // 2. Check if already completed
        let userMission = await UserMission.findOne({ user: userId, mission: missionId });

        if (userMission && userMission.status === 'COMPLETED') {
            throw new Error('Mission already completed');
        }

        // 3. Create or Update UserMission
        if (!userMission) {
            userMission = new UserMission({
                user: userId,
                mission: missionId,
                status: 'COMPLETED',
                completedAt: new Date(),
            });
        } else {
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

    /**
     * Submit video proof for a mission (Tactical Loop)
     */
    public async submitProof(userId: string, missionId: string, proofUrl: string) {
        const mission = await Mission.findById(missionId);
        if (!mission) throw new Error('Mission not found');

        // 1. Create/Update UserMission as PENDING
        let userMission = await UserMission.findOne({ user: userId, mission: missionId });
        if (userMission && userMission.status === 'COMPLETED') {
            throw new Error('Mission already completed');
        }

        if (!userMission) {
            userMission = new UserMission({
                user: userId,
                mission: missionId,
                status: 'PENDING',
                metadata: { proofUrl, submittedAt: new Date() }
            });
        } else {
            userMission.status = 'PENDING';
            userMission.metadata = { ...userMission.metadata, proofUrl, submittedAt: new Date() };
        }
        await userMission.save();

        // 2. Enqueue for AI validation
        const { queueService } = await import('./QueueService');
        await queueService.addProofValidationJob({
            userId,
            missionId,
            proofUrl
        });

        return {
            success: true,
            message: 'Proof submitted for AI verification. You will be notified once validated.',
            status: 'PENDING'
        };
    }
}
