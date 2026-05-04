import { Logger } from './logger';
import { MetaReport } from '../models/MetaReport';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';
import User from '../models/User';

/**
 * SystemInitializer handles automatic database setup on startup.
 * Ensures "Proactive Intelligence" data exists and Admin roles are assigned.
 */
import { RosterSyncService } from '../services/RosterSyncService';
import { IMetaService } from '../services/MetaService';
import cron from 'node-cron';

/**
 * SystemInitializer handles automatic database setup on startup.
 * Ensures "Proactive Intelligence" data exists and Admin roles are assigned.
 */
export class SystemInitializer {
    public static async run(metaService?: IMetaService, rosterSyncService?: RosterSyncService) {
        try {
            Logger.info('SYSTEM_INITIALIZATION: Starting deep sync...');

            // 1. Check for Meta Reports - if we only have the "initial" shell, re-seed EVERYTHING
            const reportCount = await MetaReport.countDocuments();
            // We re-seed if we have 0 or very few reports (force refresh for Deep Intel)
            if (reportCount < 10) {
                Logger.info('SYSTEM_INITIALIZATION: Low report density detected. Initializing Deep Proactive Intel 2.0...');
                await this.seedDeepMeta();
                await this.seedDeepTheories();
                await this.seedDeepScenarios();
            } else {
                Logger.info(`SYSTEM_INITIALIZATION: Detected ${reportCount} meta reports. System state healthy.`);
            }

            // 2. Ensure Master Admin exists
            const masterEmail = process.env.MASTER_ADMIN_EMAIL || 'lionelfrancis7@gmail.com';
            await this.ensureAdmin(masterEmail);

            // 3. Schedule Weekly Roster & Frame Data Sync (Every Sunday at 3am)
            if (rosterSyncService) {
                Logger.info('SYSTEM_INITIALIZATION: Running light roster sync for SF6/T8...');
                // Fast check on startup (Full sync for SF6 to ensure frame data is populated)
                await rosterSyncService.syncRoster('sf6', true);
                // Also trigger Tekken 8 light sync
                await rosterSyncService.syncRoster('tekken8', false); 

                Logger.info('SYSTEM_INITIALIZATION: Scheduling weekly full roster sync (Sunday 3am)');
                cron.schedule('0 3 * * 0', async () => {
                    Logger.info('CRON_JOB: Starting weekly full roster sync for SF6...');
                    await rosterSyncService.syncRoster('sf6', true);
                });
            }

            Logger.info('SYSTEM_INITIALIZATION: Complete.');
        } catch (error) {
            Logger.error('SYSTEM_INITIALIZATION: Failed during deep sync sequence', error);
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

    private static async seedDeepMeta() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        const reports = [
            // --- STREET FIGHTER 6: HISTORICAL (LAUNCH) ---
            {
                report_id: 'sf6-meta-launch',
                game_id: 'sf6',
                period: 'monthly',
                patch_version: '1.01',
                generated_at: oneYearAgo,
                status: 'ready',
                tier_list: [
                    { character_id: 'ken', character_name: 'Ken Masters', usage_count: 5000, win_count: 2700, win_rate: 54, trend: 'stable', top_strategies: ['Heavy Dragonlash pressure', 'Corner carry'] },
                    { character_id: 'luke', character_name: 'Luke Sullivan', usage_count: 4800, win_count: 2600, win_rate: 54, trend: 'stable', top_strategies: ['Sandblast zoning', 'Flash Knuckle loops'] },
                    { character_id: 'jp', character_name: 'JP', usage_count: 3500, win_count: 1950, win_rate: 55, trend: 'rising', top_strategies: ['Amnesia defense', 'Portal mixups'] },
                ],
                trending_characters: { rising: ['JP', 'Dee Jay'], falling: ['Ryu', 'Zangief'] },
                meta_summary: 'LAUNCH META: Ken and Luke dominate with fundamental power. JP emerges as a polarizing zoner with exceptionally high win rates in Diamond rank.',
                source_scenario_count: 1000,
                source_video_count: 50
            },

            // --- STREET FIGHTER 6: CURRENT (SEASON 2/3) ---
            {
                report_id: 'sf6-meta-current',
                game_id: 'sf6',
                period: 'weekly',
                patch_version: '3.02',
                generated_at: now,
                status: 'ready',
                tier_list: [
                    { character_id: 'akuma', character_name: 'Akuma', usage_count: 8500, win_count: 4500, win_rate: 53, trend: 'rising', top_strategies: ['Air Fireball zoning', 'Raging Demon punishes'] },
                    { character_id: 'bison', character_name: 'M. Bison', usage_count: 7200, win_count: 3800, win_rate: 52, trend: 'stable', top_strategies: ['Psycho Crusher neutral skip', 'Scissor Kick pressure'] },
                    { character_id: 'ryu', character_name: 'Ryu', usage_count: 5500, win_count: 2850, win_rate: 51, trend: 'rising', top_strategies: ['Denjin Charge setups', 'Heavy Hashogeki pressure'] },
                    { character_id: 'chunli', character_name: 'Chun-Li', usage_count: 4200, win_count: 2200, win_rate: 52, trend: 'stable', top_strategies: ['Serenity Stance cancels', 'Instant Overhead'] },
                    { character_id: 'ed', character_name: 'Ed', usage_count: 4000, win_count: 2050, win_rate: 51, trend: 'rising', top_strategies: ['Kill Switch back-spacing', 'Flicker pressure'] },
                ],
                trending_characters: { rising: ['Akuma', 'Ryu', 'Ed'], falling: ['JP', 'Ken'] },
                dominant_strategies: ['Perfect Parry optimization', 'Drive Gauge burnout management'],
                matchup_insights: [
                    { character_a: 'akuma', character_b: 'bison', win_rate_a: 52, dominant_strategy: 'Air Hadoken to beat Scissor Kicks', sample_size: 2500 },
                    { character_a: 'ryu', character_b: 'ken', win_rate_a: 50, dominant_strategy: 'Heavy Hashogeki as a frame trap against jab mash', sample_size: 4000 }
                ],
                meta_summary: 'SEASON 3: The meta has shifted toward high-utility picks like Akuma and the revived Ryu. Bison remains a powerful force in ranked due to high damage output.',
                source_scenario_count: 5000,
                source_video_count: 200
            },

            // --- TEKKEN 8: HISTORICAL (LAUNCH) ---
            {
                report_id: 't8-meta-launch',
                game_id: 'tekken8',
                period: 'monthly',
                patch_version: '1.01',
                generated_at: oneMonthAgo,
                status: 'ready',
                tier_list: [
                    { character_id: 'victor', character_name: 'Victor Chevalier', usage_count: 6000, win_count: 3300, win_rate: 55, trend: 'stable', top_strategies: ['Expulsion pressure', 'Teleport mixups'] },
                    { character_id: 'reina', character_name: 'Reina', usage_count: 5800, win_count: 2900, win_rate: 50, trend: 'rising', top_strategies: ['Sentai Stance pressure', 'EWGF dominance'] },
                    { character_id: 'azucena', character_name: 'Azucena', usage_count: 5200, win_count: 2800, win_rate: 54, trend: 'falling', top_strategies: ['Libertador mixups', 'WR3,2 spam'] },
                ],
                meta_summary: 'LAUNCH META: Victor and Azucena defined the early "Heat" game with overwhelming offensive tools. Reina is the most popular specialist character.',
                source_scenario_count: 1500,
                source_video_count: 80
            },

            // --- TEKKEN 8: CURRENT (S1/S2) ---
            {
                report_id: 't8-meta-current',
                game_id: 'tekken8',
                period: 'weekly',
                patch_version: '2.05',
                generated_at: now,
                status: 'ready',
                tier_list: [
                    { character_id: 'dragunov', character_name: 'Sergei Dragunov', usage_count: 8000, win_count: 4400, win_rate: 55, trend: 'stable', top_strategies: ['Sneak 4 pressure', 'd2 poke dominance'] },
                    { character_id: 'nina', character_name: 'Nina Williams', usage_count: 6500, win_count: 3500, win_rate: 54, trend: 'rising', top_strategies: ['Relentless strings', 'Wall pressure'] },
                    { character_id: 'jin', character_name: 'Jin Kazama', usage_count: 7000, win_count: 3650, win_rate: 52, trend: 'stable', top_strategies: ['Demon Paw control', 'Heat Dash extensions'] },
                    { character_id: 'yoshimitsu', character_name: 'Yoshimitsu', usage_count: 5500, win_count: 2900, win_rate: 53, trend: 'rising', top_strategies: ['Flash interrupts', 'Unblockable setups'] },
                    { character_id: 'king', character_name: 'King', usage_count: 6000, win_count: 3100, win_rate: 51, trend: 'falling', top_strategies: ['Chain grab mixups', 'Giant Swing'] },
                ],
                trending_characters: { rising: ['Nina', 'Yoshimitsu', 'Dragunov'], falling: ['Azucena', 'Victor'] },
                dominant_strategies: ['Heat Engage at round start', 'Wall Carry and Wall Pressure'],
                matchup_insights: [
                    { character_a: 'dragunov', character_b: 'jin', win_rate_a: 53, dominant_strategy: 'Forcing Jin to duck with d2 and punishing with df1', sample_size: 3200 }
                ],
                meta_summary: 'CURRENT META: Dragunov and Nina are widely considered top of the food chain due to oppressive neutral control. Yoshimitsu has seen a massive rise in pro play as defensive tool mastery increases.',
                source_scenario_count: 6000,
                source_video_count: 300
            },

            // --- GUILTY GEAR STRIVE: CURRENT ---
            {
                report_id: 'ggst-meta-current',
                game_id: 'ggst',
                period: 'weekly',
                patch_version: '4.01',
                generated_at: now,
                status: 'ready',
                tier_list: [
                    { character_id: 'sol', character_name: 'Sol Badguy', usage_count: 6000, win_count: 3250, win_rate: 54, trend: 'stable', top_strategies: ['Wild Assault into corner'] },
                    { character_id: 'slayer', character_name: 'Slayer', usage_count: 5500, win_count: 2900, win_rate: 53, trend: 'stable', top_strategies: ['Dandy Step mixups', 'Pile Bunker massive damage'] },
                    { character_id: 'nago', character_name: 'Nagoriyuki', usage_count: 4800, win_count: 2550, win_rate: 53, trend: 'stable', top_strategies: ['Blood gauge management', 'Clone pressure'] },
                    { character_id: 'queen_dizzy', character_name: 'Queen Dizzy', usage_count: 5200, win_count: 2650, win_rate: 51, trend: 'rising', top_strategies: ['Projectile setplay', 'Ice summon zoning'] },
                ],
                meta_summary: 'SEASON 4: Slayer and the recently released Queen Dizzy are shaking up the high-tier landscape. Sol remains the gold standard for aggressive play.',
                source_scenario_count: 4000,
                source_video_count: 150
            },

            // --- MK1: CURRENT ---
            {
                report_id: 'mk1-meta-current',
                game_id: 'mk1',
                period: 'weekly',
                patch_version: '1.45',
                generated_at: now,
                status: 'ready',
                tier_list: [
                    { character_id: 't1000', character_name: 'T-1000', usage_count: 7000, win_count: 3750, win_rate: 54, trend: 'rising', top_strategies: ['Liquid metal mixups', 'Low pokability'] },
                    { character_id: 'homelander', character_name: 'Homelander', usage_count: 6200, win_count: 3300, win_rate: 53, trend: 'stable', top_strategies: ['Flying zoning', 'Overhead pressure'] },
                    { character_id: 'johnny', character_name: 'Johnny Cage', usage_count: 8000, win_count: 4100, win_rate: 51, trend: 'falling', top_strategies: ['Cypex kameo synergy', 'Pressure loop'] },
                    { character_id: 'geras', character_name: 'Geras', usage_count: 3500, win_count: 1850, win_rate: 53, trend: 'rising', top_strategies: ['Time freeze setups', 'Frame trap dominance'] },
                ],
                meta_summary: 'LATE 2025: T-1000 and Homelander define the meta through mobility and mixup potential. Johnny Cage remains high usage but win rate has normalized after nerfs.',
                source_scenario_count: 3800,
                source_video_count: 120
            }
        ];

        for (const r of reports) {
            await MetaReport.findOneAndUpdate({ report_id: r.report_id }, r, { upsert: true });
        }
    }

    private static async seedDeepTheories() {
        const theories = [
            {
                theory_id: 'sf6-akuma-deep',
                game_id: 'sf6',
                type: 'character',
                character_id: 'akuma',
                character_name: 'Akuma',
                title: 'Akuma: The Glass Cannon Masterclass',
                summary: 'Akuma offers the highest offensive ceiling in SF6 at the cost of the lowest health pool.',
                full_theory: 'Playing Akuma requires a balance of relentless pressure and precise positioning. His Air Hadoken (Zanku Hadoken) is his best neutral tool to bait anti-airs. In Season 3, his combo conversions from cr.MK into Drive Rush provide a 40% damage threat from almost any touch. Watch for his Ashura Senku (teleport) to cross-up or escape corner pressure.',
                key_strengths: ['Versatile projectile game', 'High damage output', 'Best mobility in class'],
                key_weaknesses: ['Extremely low health (9000)', 'Vulnerable to high-damage super punishes'],
                win_conditions: ['Connecting a raw Level 3 Super', 'Maintain air-borne pressure to force defensive mistakes'],
                counterplay: ['Perfect Parry the Zanku Hadoken', 'Use high-damage normals to punish his Low Health profile'],
                source_scenario_count: 50,
                confidence: 'high',
                generated_at: new Date()
            },
            {
                theory_id: 't8-dragunov-pressure',
                game_id: 'tekken8',
                type: 'character',
                character_id: 'dragunov',
                character_name: 'Sergei Dragunov',
                title: 'Dragunov: Oppressive Neutral & Frame Traps',
                summary: 'Dragunov is the undisputed king of pressure in Tekken 8.',
                full_theory: 'His Sneak (SNK) stance is the core of his mixup game. The Sneak 4 (SNK 4) is a world-class low that forces the opponent to duck, opening them up for massive mid-punishes like df1 or df2. His Heat Smash is arguably the best in the game for tracking and damage.',
                key_strengths: ['Relentless plus frames', 'Powerful wall game', 'Top-tier Heat Smash'],
                key_weaknesses: ['Linear movement can be sidestepped', 'Weak if forced into a defensive rhythm'],
                win_conditions: ['Cornering the opponent and cycling df1 / d2', 'Heat-mode rushdown'],
                counterplay: ['Sidestep Left to avoid his major linear tools', 'Interrupt Sneak transitions with fast jabs'],
                source_scenario_count: 65,
                confidence: 'high',
                generated_at: new Date()
            }
        ];

        for (const t of theories) {
            await TheoryDoc.findOneAndUpdate({ theory_id: t.theory_id }, t, { upsert: true });
        }
    }

    private static async seedDeepScenarios() {
        const dummyEmbedding = new Array(768).fill(0);
        const scenarios = [
            {
                scenario_id: 'sf6-akuma-teleport-punish',
                game_id: 'sf6',
                description: 'Punishing Akuma Teleport (Ashura Senku)',
                context: 'Akuma uses teleport to escape the corner.',
                characters_involved: ['akuma'],
                embedding: dummyEmbedding,
                tags: ['punish', 'akuma', 'defense']
            },
            {
                scenario_id: 't8-dragunov-d2-counter',
                game_id: 'tekken8',
                description: 'Dealing with Dragunov d2 Low Poke',
                context: 'Dragunov cycles d2 repeatedly to chip health.',
                characters_involved: ['dragunov'],
                embedding: dummyEmbedding,
                tags: ['matchup', 'dragunov', 'defense']
            }
        ];

        for (const s of scenarios) {
            await Scenario.findOneAndUpdate({ scenario_id: s.scenario_id }, s, { upsert: true });
        }
    }
}
