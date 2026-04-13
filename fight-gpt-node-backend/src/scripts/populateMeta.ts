import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Database } from '../config/database';
import { Logger } from '../helpers/logger';
import { MetaReport } from '../models/MetaReport';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';

async function seedProactiveMeta() {
    try {
        await Database.connect();

        // 1. Seed Meta Reports (SF6 & Tekken 8)
        const reports = [
            {
                report_id: 'sf6-meta-initial',
                game_id: 'sf6',
                period: 'weekly' as const,
                generated_at: new Date(),
                status: 'ready' as const,
                tier_list: [
                    { character_id: 'ken', character_name: 'Ken', usage_count: 500, win_count: 275, win_rate: 55, trend: 'stable' as const, top_strategies: ['Jinrai pressure', 'Drive Rush extensions'] },
                    { character_id: 'jp', character_name: 'JP', usage_count: 420, win_count: 231, win_rate: 55, trend: 'falling' as const, top_strategies: ['Amnesia setups', 'Portal zoning'] },
                    { character_id: 'chunli', character_name: 'Chun-Li', usage_count: 380, win_count: 205, win_rate: 54, trend: 'rising' as const, top_strategies: ['Stance cancels', 'Perfect parry punish'] },
                ],
                trending_characters: { rising: ['Chun-Li', 'Luke'], falling: ['JP'] },
                dominant_strategies: ['Perfect Parry optimization', 'Drive Gauge management at low health'],
                matchup_insights: [
                    { character_a: 'ken', character_b: 'jp', win_rate_a: 52, dominant_strategy: 'In-fighting to neutralize projectiles', sample_size: 1000 }
                ],
                meta_summary: 'Ken remains the most versatile pick, but Chun-Li is rising fast due to advanced stance technicality being mastered by top players. JP usage is dipping as players find more ways to exploit his close-range weaknesses.',
                source_scenario_count: 50,
                source_video_count: 10
            },
            {
                report_id: 'tekken8-meta-initial',
                game_id: 'tekken8',
                period: 'weekly' as const,
                generated_at: new Date(),
                status: 'ready' as const,
                tier_list: [
                    { character_id: 'jin', character_name: 'Jin Kazama', usage_count: 600, win_count: 312, win_rate: 52, trend: 'stable' as const, top_strategies: ['Heat Dash pressure', 'Demon Paw spacing'] },
                    { character_id: 'kazuya', character_name: 'Kazuya Mishima', usage_count: 450, win_count: 220, win_rate: 49, trend: 'rising' as const, top_strategies: ['Electric Wind God Fist consistency', 'Hellsweep 50/50'] },
                ],
                trending_characters: { rising: ['Kazuya', 'King'], falling: ['Reina'] },
                dominant_strategies: ['Heat Engage early to maintain pressure', 'Wall combo damage optimization'],
                matchup_insights: [
                    { character_a: 'jin', character_b: 'kazuya', win_rate_a: 51, dominant_strategy: 'Better poking range vs Mishima vulnerability', sample_size: 800 }
                ],
                meta_summary: 'Jin Kazama is Currently the "All-Rounder" king of T8. The Heat system favors his aggressive rushdown. Kazuya is seeing a resurgence as legacy Mishima players adapt to the new mechanics.',
                source_scenario_count: 40,
                source_video_count: 8
            },
            {
                report_id: 'ggst-meta-initial',
                game_id: 'ggst',
                period: 'weekly' as const,
                generated_at: new Date(),
                status: 'ready' as const,
                tier_list: [
                    { character_id: 'sol', character_name: 'Sol Badguy', usage_count: 550, win_count: 300, win_rate: 54, trend: 'stable' as const, top_strategies: ['Wild Assault combos', 'Strike/throw mixups'] },
                    { character_id: 'nago', character_name: 'Nagoriyuki', usage_count: 410, win_count: 221, win_rate: 53, trend: 'rising' as const, top_strategies: ['Blood gauge management', 'Fukyo pressure'] },
                ],
                trending_characters: { rising: ['Nagoriyuki', 'Happy Chaos'], falling: ['May'] },
                dominant_strategies: ['Positive Bonus momentum', 'Deflect Shield usages'],
                matchup_insights: [
                    { character_a: 'sol', character_b: 'nago', win_rate_a: 50, dominant_strategy: 'Baiting Fukyo with f.S', sample_size: 600 }
                ],
                meta_summary: 'Sol remains a powerhouse with the current system mechanics. Nagoriyuki is heavily played at high levels due to explosive damage potential and large normals.',
                source_scenario_count: 30,
                source_video_count: 6
            },
            {
                report_id: 'mk1-meta-initial',
                game_id: 'mk1',
                period: 'weekly' as const,
                generated_at: new Date(),
                status: 'ready' as const,
                tier_list: [
                    { character_id: 'johnny', character_name: 'Johnny Cage', usage_count: 650, win_count: 350, win_rate: 53, trend: 'stable' as const, top_strategies: ['Plus frame pressure', 'Kameo setups'] },
                    { character_id: 'raiden', character_name: 'Raiden', usage_count: 400, win_count: 212, win_rate: 53, trend: 'falling' as const, top_strategies: ['Storm Cell chip damage', 'Teleport mixups'] },
                ],
                trending_characters: { rising: ['Sindel', 'Ashrah'], falling: ['Raiden'] },
                dominant_strategies: ['Kano/Stryker Kameo chip damage lock', 'Upblock reads'],
                matchup_insights: [
                    { character_a: 'johnny', character_b: 'raiden', win_rate_a: 54, dominant_strategy: 'Close distance quickly to prevent zoning', sample_size: 700 }
                ],
                meta_summary: 'Johnny Cage dictates the pace of the game in close quarters, while Raiden is seeing slight drops as players learn the timing to upblock his Storm Cell.',
                source_scenario_count: 35,
                source_video_count: 7
            }
        ];

        for (const r of reports) {
            await MetaReport.findOneAndUpdate({ report_id: r.report_id }, r, { upsert: true });
        }

        // 2. Seed Theory Documents
        const theories = [
            {
                theory_id: 'sf6-ryu-theory',
                game_id: 'sf6',
                type: 'character' as const,
                character_id: 'ryu',
                character_name: 'Ryu',
                title: 'SF6 Ryu: The Patient Strategist',
                summary: 'Traditional fundamental gameplay remains Ryu strongest asset in SF6.',
                full_theory: 'In Street Fighter 6, Ryu benefits from high single-hit damage and powerful fireball zoning. Use Denjin Charge to enhance Hadokens and Hashogekis for better frame data and safe pressure. Focus on spacing with st.HP and st.MK to force neutral mistakes.',
                key_strengths: ['High damage punishes', 'Excellent mid-range pokes'],
                key_weaknesses: ['Susceptible to Drive Impact if over-committing', 'Linear gameplan'],
                win_conditions: ['Successful anti-airs', 'Corner pressure with Heavy Hashogeki'],
                counterplay: ['Neutral jump Hadokens', 'Wait for unsafe Tatsu attempts'],
                source_scenario_count: 25,
                confidence: 'high' as const,
                generated_at: new Date()
            },
            {
                theory_id: 'sf6-ken-theory',
                game_id: 'sf6',
                type: 'character' as const,
                character_id: 'ken',
                character_name: 'Ken',
                title: 'SF6 Ken: Aggressive Dominance',
                summary: 'Ken excels at corner carry and relentless pressure transitions.',
                full_theory: 'Ken is the aggressive counterpart to Ryu. His Jinrai Kick follow-ups provide a layered mixup game that forces the opponent to guess between low, overhead, and mid. Drive Rush st.HP is one of his best neutral skip tools.',
                key_strengths: ['Best corner carry in the game', 'Fast walk speed'],
                key_weaknesses: ['Worse fireballs than Ryu/Guile', 'Relies on Drive Gauge for highest tier pressure'],
                win_conditions: ['Getting the opponent to the corner', 'Jinrai mixups'],
                counterplay: ['Interrupt slow Jinrai followups', 'Respect the Dragonlash Kick plus frames'],
                source_scenario_count: 30,
                confidence: 'high' as const,
                generated_at: new Date()
            }
        ];

        for (const t of theories) {
            await TheoryDoc.findOneAndUpdate({ theory_id: t.theory_id }, t, { upsert: true });
        }

        // 3. Seed Scenarios (for "Ask the Meta")
        // Note: For real vector search, we'd need actual embeddings.
        // We will seed 0-filled embeddings for now as placeholders.
        const dummyEmbedding = new Array(768).fill(0);

        const scenarios = [
            {
                scenario_id: 'sf6-punish-di',
                game_id: 'sf6',
                description: 'How to punish Drive Impact effectively',
                context: 'Opponent uses Drive Impact predictably or in the corner.',
                characters_involved: ['all'],
                embedding: dummyEmbedding,
                match_references: [],
                tags: ['punish', 'drive-impact', 'defense']
            },
            {
                scenario_id: 'sf6-ken-jinrai',
                game_id: 'sf6',
                description: 'Dealing with Ken Jinrai kick pressure',
                context: 'Ken performs Jinrai kick and follows up with high/low mixup.',
                characters_involved: ['ken'],
                embedding: dummyEmbedding,
                match_references: [],
                tags: ['matchup', 'pressure', 'ken']
            }
        ];

        for (const s of scenarios) {
            await Scenario.findOneAndUpdate({ scenario_id: s.scenario_id }, s, { upsert: true });
        }

        Logger.info('SUCCESS: Proactive Meta Intelligence Seeded.');
        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        Logger.error('Failed to seed meta data', error);
        process.exit(1);
    }
}

seedProactiveMeta();
