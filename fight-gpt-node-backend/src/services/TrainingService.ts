import { IAnalysis, Analysis } from '../models/Analysis';
import Mission from '../models/Mission';
import UserMission from '../models/UserMission';
import { TimelineEvent } from '../types';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { Logger } from '../helpers/logger';

export class TrainingService {
    private missionTemplates = [
        { title: 'ANTI_AIR_MASTER', goal: 'Land 5 clean anti-airs in a single match.', reward: 150 },
        { title: 'PERFECT_PARRY_PRACTICE', goal: 'Perform 3 Perfect Parries during match pressure.', reward: 100 },
        { title: 'COMBO_SPECIALIST', goal: 'Execute a full Drive Rush combo in a real match.', reward: 200 },
        { title: 'DEFENSIVE_WALL', goal: 'Successfully tech 3 throw attempts.', reward: 100 },
        { title: 'WHIFF_PUNISH_GOD', goal: 'Punish 3 heavy whiffs with a medium or heavy button.', reward: 150 },
        { title: 'RESOURCE_MANAGER', goal: 'Win a round without entering Burnout.', reward: 150 },
        { title: 'CHIP_DAMAGE_THREAT', goal: 'Win a round using chip damage from a Super Art.', reward: 100 },
    ];

    /**
     * Start the Daily Mission scheduler (runs at 00:00 daily)
     */
    public startScheduler(): void {
        cron.schedule('0 0 * * *', async () => {
            Logger.info('[TrainingService] Running daily mission assignment cycle...');
            await this.generateDailyMissionsForAllUsers();
        });
        Logger.info('[TrainingService] Daily Mission Scheduler started (00:00 daily)');
    }

    /**
     * Generate and assign new daily missions to all active users
     */
    public async generateDailyMissionsForAllUsers(): Promise<void> {
        try {
            const User = mongoose.model('User');
            const users = await User.find({ onboardingCompleted: true }).exec();
            
            Logger.info(`[TrainingService] Assigning missions to ${users.length} users...`);

            for (const user of users) {
                await this.assignDailyMissionsToUser(user._id);
            }
            
            Logger.info('[TrainingService] Daily mission assignment complete.');
        } catch (error) {
            Logger.error('[TrainingService] Failed to assign daily missions', error);
        }
    }

    private async assignDailyMissionsToUser(userId: mongoose.Types.ObjectId): Promise<void> {
        try {
            // 1. Clear old pending daily missions (keep completed ones)
            await UserMission.deleteMany({
                user: userId,
                status: 'PENDING',
                type: 'DAILY' // We should tag these
            });

            // 2. Pick 3 random templates
            const shuffled = [...this.missionTemplates].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);

            for (const template of selected) {
                const mission = await Mission.create({
                    title: template.title,
                    description: template.goal,
                    type: 'DAILY',
                    difficulty: 'MEDIUM',
                    reward: { xp: template.reward }
                });

                await UserMission.create({
                    user: userId,
                    mission: mission._id,
                    status: 'AVAILABLE',
                    type: 'DAILY'
                });
            }
        } catch (e) {
            Logger.error(`[TrainingService] Failed to assign missions to user ${userId}`, e);
        }
    }

    /**
     * Parse an analysis and generate personalized training drills (Missions)
     */
    public async generateDrillsFromAnalysis(analysis: IAnalysis): Promise<void> {
        if (!analysis.user_id || !analysis.analysis) return;

        const { timeline, daily_mission, p2_character } = analysis.analysis;
        const userId = new mongoose.Types.ObjectId(analysis.user_id);

        // 1. Process Daily Mission if present
        if (daily_mission) {
            await this.createMissionFromAI(userId, daily_mission, analysis.analysis_id);
        }

        // 2. Process Timeline for missed punishes or bad habits
        if (timeline && timeline.length > 0) {
            const mistakes = timeline.filter(e => 
                e.event_type === 'punish_missed' || e.event_type === 'bad_habit'
            );

            // Take top 2 mistakes to avoid overwhelming the user
            for (const mistake of mistakes.slice(0, 2)) {
                await this.createMissionFromMistake(userId, mistake, p2_character || 'Opponent', analysis.analysis_id);
            }
        }
    }

    private async createMissionFromAI(userId: mongoose.Types.ObjectId, aiMission: any, analysisId: string) {
        try {
            const mission = await Mission.create({
                title: aiMission.title.toUpperCase(),
                description: aiMission.goal,
                type: 'DRILL',
                difficulty: 'MEDIUM',
                reward: { xp: 150 },
                criteria: { steps: aiMission.drill_steps, analysisId }
            });

            await UserMission.create({
                user: userId,
                mission: mission._id,
                status: 'PENDING'
            });
        } catch (e) {
            console.error('TRAINING_SERVICE: Failed to create AI mission', e);
        }
    }

    private async createMissionFromMistake(userId: mongoose.Types.ObjectId, mistake: TimelineEvent, opponent: string, analysisId: string) {
        try {
            const title = `COUNTER_${opponent.toUpperCase()}_TACTIC`;
            
            // Check if user already has a pending mission with this title
            const existing = await UserMission.findOne({ 
                user: userId, 
                status: 'PENDING' 
            }).populate({
                path: 'mission',
                match: { title }
            });

            if (existing && existing.mission) return;

            const mission = await Mission.create({
                title,
                description: mistake.coach_advice,
                type: 'DRILL',
                difficulty: 'EASY',
                reward: { xp: 100 },
                criteria: { eventType: mistake.event_type, description: mistake.description, analysisId }
            });

            await UserMission.create({
                user: userId,
                mission: mission._id,
                status: 'PENDING'
            });
        } catch (e) {
            console.error('TRAINING_SERVICE: Failed to create mistake mission', e);
        }
    }

    /**
     * Get all active and completed missions for a user
     */
    public async getMissionsForUser(userId: string) {
        return await UserMission.find({ user: userId })
            .populate('mission')
            .sort({ createdAt: -1 });
    }

    /**
     * Manually complete a mission and award XP
     */
    public async completeMission(userId: string, userMissionId: string) {
        const userMission = await UserMission.findOne({ _id: userMissionId, user: userId }).populate('mission');
        if (!userMission) throw new Error('Mission not found');
        if (userMission.status === 'COMPLETED') return userMission;

        userMission.status = 'COMPLETED';
        userMission.completedAt = new Date();
        await userMission.save();

        // Award XP
        const mission = userMission.mission as any;
        const xpToAdd = mission.reward?.xp || 100;

        const User = mongoose.model('User');
        const user = await User.findById(userId);
        if (user) {
            const currentXp = (user as any).gamification.xp || 0;
            const newXp = currentXp + xpToAdd;
            (user as any).gamification.xp = newXp;
            
            // Level up every 1000 XP
            (user as any).gamification.level = Math.floor(newXp / 1000) + 1;
            
            await user.save();
        }

        return userMission;
    }

    /**
     * Submit video proof (links to a new analysis)
     */
    public async submitProof(userId: string, userMissionId: string, proofUrl: string) {
        const userMission = await UserMission.findOne({ _id: userMissionId, user: userId });
        if (!userMission) throw new Error('Mission not found');

        userMission.metadata = { ...userMission.metadata, proofUrl };
        await userMission.save();

        return { success: true, message: 'Proof submitted for tactical review' };
    }
}

export default new TrainingService();
