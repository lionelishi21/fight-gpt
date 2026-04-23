import cron from 'node-cron';
import { ITheoryService } from './TheoryService';
import { NotificationService } from './NotificationService';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { TheoryDoc } from '../models/TheoryDocument';
import { Scenario } from '../models/Scenario';

/**
 * AutoResearchService — Karpathy-style autonomous research agent.
 *
 * Runs on a schedule and:
 * 1. Scans every active game for characters with low/no theory
 * 2. Finds matchups with new scenario data since last theory generation
 * 3. Auto-generates theory where gaps exist
 * 4. Broadcasts push notifications to all users when new intel is ready
 *
 * Designed to keep the knowledge base alive without any manual triggering.
 */
export class AutoResearchService {
    private isRunning = false;

    constructor(
        private readonly theoryService: ITheoryService,
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Start the autonomous research loop.
     * Runs at 2am daily — off-peak, low-noise.
     */
    start(): void {
        // Daily at 02:00
        cron.schedule('0 2 * * *', () => this.runResearchCycle(), { timezone: 'UTC' });
        console.log('[AutoResearch] Scheduled — runs daily at 02:00 UTC');
    }

    /**
     * Manually trigger a full research cycle (useful from admin panel).
     */
    async runResearchCycle(): Promise<{ character: number; matchup: number; skipped: number }> {
        if (this.isRunning) {
            console.log('[AutoResearch] Cycle already in progress — skipping');
            return { character: 0, matchup: 0, skipped: 1 };
        }

        this.isRunning = true;
        console.log('[AutoResearch] Starting research cycle...');

        let characterGenerated = 0;
        let matchupGenerated = 0;
        let skipped = 0;

        try {
            const games = await Game.find({ is_active: true }).lean().exec();

            for (const game of games) {
                const gameId = game.game_id;
                const characters = await Character.find({ game_id: gameId, is_current: true }).lean().exec();

                // ── 1. Character theory gaps ───────────────────────────────
                for (const char of characters) {
                    const charId = char.name.toLowerCase().replace(/\s+/g, '_');

                    try {
                        const scenarioCount = await Scenario.countDocuments({
                            game_id: gameId,
                            characters_involved: charId,
                        });

                        if (scenarioCount < 3) { skipped++; continue; } // Not enough data

                        const existing = await TheoryDoc.findOne({
                            game_id: gameId,
                            character_id: charId,
                            type: 'character',
                            is_current_patch: true,
                        }).lean().exec();

                        // Regenerate if: no theory, or theory is older than 7 days, or
                        // new scenarios have arrived since last generation
                        const needsUpdate = !existing
                            || this.isStale(existing.generated_at, 7)
                            || await this.hasNewScenarios(gameId, charId, existing.generated_at);

                        if (!needsUpdate) { skipped++; continue; }

                        console.log(`[AutoResearch] Generating character theory: ${gameId}/${charId}`);
                        const result = await this.theoryService.generateCharacterTheory(gameId, charId);

                        if (result.success && result.data) {
                            characterGenerated++;
                            // Notification already fired inside TheoryService — no duplicate needed
                        }
                    } catch (err) {
                        console.error(`[AutoResearch] Failed character theory ${charId}:`, err);
                    }
                }

                // ── 2. High-priority matchup gaps ─────────────────────────
                // Generate matchups for the top 5 characters by scenario count
                const topChars = await this.getTopCharactersByScenarioCount(gameId, 5);

                for (let i = 0; i < topChars.length; i++) {
                    for (let j = i + 1; j < topChars.length; j++) {
                        const charA = topChars[i];
                        const charB = topChars[j];

                        try {
                            const scenarioCount = await Scenario.countDocuments({
                                game_id: gameId,
                                characters_involved: { $all: [charA, charB] },
                            });

                            if (scenarioCount < 3) { skipped++; continue; }

                            const [a, b] = [charA, charB].sort();
                            const existing = await TheoryDoc.findOne({
                                game_id: gameId,
                                character_a: a,
                                character_b: b,
                                type: 'matchup',
                                is_current_patch: true,
                            }).lean().exec();

                            const needsUpdate = !existing
                                || this.isStale(existing.generated_at, 14)
                                || await this.hasNewMatchupScenarios(gameId, charA, charB, existing.generated_at);

                            if (!needsUpdate) { skipped++; continue; }

                            console.log(`[AutoResearch] Generating matchup theory: ${charA} vs ${charB}`);
                            const result = await this.theoryService.generateMatchupTheory(gameId, charA, charB);

                            if (result.success && result.data) {
                                matchupGenerated++;
                            }
                        } catch (err) {
                            console.error(`[AutoResearch] Failed matchup ${charA} vs ${charB}:`, err);
                        }
                    }
                }

                // ── 3. Broadcast summary if anything was generated ─────────
                if (characterGenerated + matchupGenerated > 0) {
                    await this.notificationService.broadcast('VECTOR_INSIGHT', {
                        gameId,
                        title: `${(game as any).name} intel updated`,
                        description: `${characterGenerated} character theories and ${matchupGenerated} matchup theories refreshed from latest tournament data.`,
                        link: '/dojo/roster',
                    }, 'medium');
                }
            }

            console.log(`[AutoResearch] Cycle complete — ${characterGenerated} character, ${matchupGenerated} matchup, ${skipped} skipped`);
        } catch (err) {
            console.error('[AutoResearch] Cycle failed:', err);
        } finally {
            this.isRunning = false;
        }

        return { character: characterGenerated, matchup: matchupGenerated, skipped };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private isStale(date: Date, days: number): boolean {
        const ms = days * 24 * 60 * 60 * 1000;
        return Date.now() - new Date(date).getTime() > ms;
    }

    private async hasNewScenarios(gameId: string, charId: string, since: Date): Promise<boolean> {
        const count = await Scenario.countDocuments({
            game_id: gameId,
            characters_involved: charId,
            created_at: { $gt: since },
        });
        return count > 0;
    }

    private async hasNewMatchupScenarios(gameId: string, charA: string, charB: string, since: Date): Promise<boolean> {
        const count = await Scenario.countDocuments({
            game_id: gameId,
            characters_involved: { $all: [charA, charB] },
            created_at: { $gt: since },
        });
        return count > 0;
    }

    private async getTopCharactersByScenarioCount(gameId: string, limit: number): Promise<string[]> {
        const results = await (Scenario as any).aggregate([
            { $match: { game_id: gameId } },
            { $unwind: '$characters_involved' },
            { $group: { _id: '$characters_involved', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]);
        return results.map((r: any) => r._id);
    }
}
