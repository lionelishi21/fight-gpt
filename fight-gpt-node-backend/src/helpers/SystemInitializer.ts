import { Logger } from './logger';
import { MetaReport } from '../models/MetaReport';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';
import User from '../models/User';

/**
 * SystemInitializer handles automatic database setup on startup.
 * Ensures "Proactive Intelligence" data exists and Admin roles are assigned.
 */
export class SystemInitializer {
    public static async run() {
        try {
            Logger.info('SYSTEM_INITIALIZATION: Starting check...');

            // 1. Check for Meta Reports
            const reportCount = await MetaReport.countDocuments();
            if (reportCount === 0) {
                Logger.info('SYSTEM_INITIALIZATION: No meta reports found. Seeding default intelligence...');
                await this.seedMeta();
            } else {
                Logger.info(`SYSTEM_INITIALIZATION: Detected ${reportCount} meta reports. Skipping seeder.`);
            }

            // 2. Ensure Master Admin exists
            const masterEmail = process.env.MASTER_ADMIN_EMAIL || 'lionelfrancis7@gmail.com';
            await this.ensureAdmin(masterEmail);

            Logger.info('SYSTEM_INITIALIZATION: Complete.');
        } catch (error) {
            Logger.error('SYSTEM_INITIALIZATION: Failed during startup sequence', error);
        }
    }

    private static async ensureAdmin(email: string) {
        let user = await User.findOne({ email });
        if (!user) {
            Logger.info(`SYSTEM_INITIALIZATION: Creating master admin account: ${email}`);
            user = new User({
                name: 'System Admin',
                email: email,
                password: process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123!',
                role: 'admin',
                onboardingCompleted: true,
                preferences: { favorites: [], skillLevel: 'pro' }
            });
            await user.save();
        } else if (user.role !== 'admin') {
            Logger.info(`SYSTEM_INITIALIZATION: Promoting ${email} to admin role.`);
            user.role = 'admin';
            await user.save();
        }
    }

    private static async seedMeta() {
        // High-quality mock data for the initial "Proactive" launch
        const reports = [
            {
                report_id: 'sf6-meta-initial',
                game_id: 'sf6',
                period: 'weekly',
                generated_at: new Date(),
                status: 'ready',
                tier_list: [
                    { character_id: 'ken', character_name: 'Ken', usage_count: 500, win_count: 275, win_rate: 55, trend: 'stable', top_strategies: ['Jinrai pressure', 'Drive Rush extensions'] },
                    { character_id: 'jp', character_name: 'JP', usage_count: 420, win_count: 231, win_rate: 55, trend: 'falling', top_strategies: ['Amnesia setups', 'Portal zoning'] },
                    { character_id: 'chunli', character_name: 'Chun-Li', usage_count: 380, win_count: 205, win_rate: 54, trend: 'rising', top_strategies: ['Stance cancels', 'Perfect parry punish'] },
                ],
                trending_characters: { rising: ['Chun-Li', 'Luke'], falling: ['JP'] },
                dominant_strategies: ['Perfect Parry optimization', 'Drive Gauge management at low health'],
                meta_summary: 'Ken remains the most versatile pick, but Chun-Li is rising fast. JP usage is dipping due to close-range vulnerability exploitation.',
                source_scenario_count: 50,
                source_video_count: 10
            },
            {
                report_id: 'tekken8-meta-initial',
                game_id: 'tekken8',
                period: 'weekly',
                generated_at: new Date(),
                status: 'ready',
                tier_list: [
                    { character_id: 'jin', character_name: 'Jin Kazama', usage_count: 600, win_count: 312, win_rate: 52, trend: 'stable', top_strategies: ['Heat Dash pressure', 'Demon Paw spacing'] },
                    { character_id: 'kazuya', character_name: 'Kazuya Mishima', usage_count: 450, win_count: 220, win_rate: 49, trend: 'rising', top_strategies: ['Electric Wind God Fist consistency', 'Hellsweep 50/50'] },
                ],
                trending_characters: { rising: ['Kazuya', 'King'], falling: ['Reina'] },
                meta_summary: 'Jin Kazama dominates the early T8 meta with versatile Heat pressure. Kazuya is rising as legacy players adapt.',
                source_scenario_count: 40,
                source_video_count: 8
            }
        ];

        for (const r of reports) {
            await MetaReport.findOneAndUpdate({ report_id: r.report_id }, r, { upsert: true });
        }

        const theories = [
            {
                theory_id: 'sf6-ryu-theory',
                game_id: 'sf6',
                type: 'character',
                character_id: 'ryu',
                character_name: 'Ryu',
                title: 'SF6 Ryu: The Patient Strategist',
                summary: 'Fundamental gameplay remains Ryu strongest asset in SF6.',
                full_theory: 'Focus on spacing with st.HP and st.MK to force neutral mistakes. Use Denjin Hadoken to keep opponents honest.',
                key_strengths: ['High damage punishes', 'Excellent mid-range'],
                source_scenario_count: 25,
                confidence: 'high',
                generated_at: new Date()
            }
        ];

        for (const t of theories) {
            await TheoryDoc.findOneAndUpdate({ theory_id: t.theory_id }, t, { upsert: true });
        }

        const dummyEmbedding = new Array(768).fill(0);
        const scenarios = [
            {
                scenario_id: 'sf6-punish-di',
                game_id: 'sf6',
                description: 'How to punish Drive Impact effectively',
                context: 'Opponent uses Drive Impact predictably or in the corner.',
                characters_involved: ['all'],
                embedding: dummyEmbedding,
                tags: ['punish', 'drive-impact']
            }
        ];

        for (const s of scenarios) {
            await Scenario.findOneAndUpdate({ scenario_id: s.scenario_id }, s, { upsert: true });
        }
    }
}
