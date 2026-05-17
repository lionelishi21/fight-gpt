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
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

            // 1. Clear today's uncompleted daily missions so we can reassign fresh ones
            await UserMission.deleteMany({
                user: userId,
                type: 'DAILY',
                assignedDate: today,
                status: { $in: ['PENDING', 'AVAILABLE'] },
            });

            // 2. Look up user's main character for character-specific missions
            const User = mongoose.model('User');
            const user = await User.findById(userId).select('slots activeSlotIndex').lean();
            const slots = (user as any)?.slots || [];
            const activeSlot = slots[(user as any)?.activeSlotIndex ?? 0];
            const mainCharId = activeSlot?.characterId;
            let mainCharName: string | null = null;
            let gameId: string | null = activeSlot?.gameId || null;

            if (mainCharId) {
                const Character = mongoose.model('Character');
                const char = await Character.findById(mainCharId).select('name game_id').lean();
                if (char) {
                    mainCharName = (char as any).name;
                    gameId = gameId || (char as any).game_id;
                }
            }

            // 3. Build mission list: 2 general + 1 character-specific (if available)
            const shuffled = [...this.missionTemplates].sort(() => 0.5 - Math.random());
            const generalMissions = shuffled.slice(0, mainCharName ? 2 : 3);

            const templates = [...generalMissions];
            if (mainCharName) {
                templates.push({
                    title: `${mainCharName.toUpperCase()}_MASTERY`,
                    goal: `Focus on ${mainCharName}'s core game plan: pick their most threatening move and land it 5 times in actual matches. Study the spacing that makes it safe.`,
                    reward: 200,
                });
            }

            for (const template of templates) {
                const mission = await Mission.create({
                    title: template.title,
                    description: template.goal,
                    type: 'DRILL',         // Mission model only allows DRILL/MATCHUP/KNOWLEDGE
                    difficulty: 'MEDIUM',
                    reward: { xp: template.reward }
                });
                await UserMission.create({
                    user: userId,
                    mission: mission._id,
                    status: 'AVAILABLE',
                    type: 'DAILY',
                    assignedDate: today,
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
        const today = new Date().toISOString().slice(0, 10);

        const existing = await UserMission.find({
            user: userId,
            $or: [
                { assignedDate: today, status: { $in: ['AVAILABLE', 'PENDING'] } },
                { status: 'COMPLETED', completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            ]
        })
            .populate('mission')
            .sort({ createdAt: -1 })
            .limit(10);

        // Auto-assign if user has no missions for today
        if (existing.length === 0) {
            await this.assignDailyMissionsToUser(new mongoose.Types.ObjectId(userId));
            return await UserMission.find({
                user: userId,
                assignedDate: today,
                status: { $in: ['AVAILABLE', 'PENDING'] },
            })
                .populate('mission')
                .sort({ createdAt: -1 })
                .limit(10);
        }

        return existing;
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
