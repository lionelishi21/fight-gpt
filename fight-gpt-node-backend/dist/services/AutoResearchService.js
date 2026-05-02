"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoResearchService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Game_1 = require("../models/Game");
const Character_1 = require("../models/Character");
const TheoryDocument_1 = require("../models/TheoryDocument");
const Scenario_1 = require("../models/Scenario");
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
class AutoResearchService {
    theoryService;
    notificationService;
    isRunning = false;
    constructor(theoryService, notificationService) {
        this.theoryService = theoryService;
        this.notificationService = notificationService;
    }
    /**
     * Start the autonomous research loop.
     * Runs at 2am daily — off-peak, low-noise.
     */
    start() {
        // Daily at 02:00
        node_cron_1.default.schedule('0 2 * * *', () => this.runResearchCycle(), { timezone: 'UTC' });
        console.log('[AutoResearch] Scheduled — runs daily at 02:00 UTC');
    }
    /**
     * Manually trigger a full research cycle (useful from admin panel).
     */
    async runResearchCycle() {
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
            const games = await Game_1.Game.find({ is_active: true }).lean().exec();
            for (const game of games) {
                const gameId = game.game_id;
                const characters = await Character_1.Character.find({ game_id: gameId, is_current: true }).lean().exec();
                // ── 1. Character theory gaps ───────────────────────────────
                for (const char of characters) {
                    const charId = char.name.toLowerCase().replace(/\s+/g, '_');
                    for (const level of ['Rookie', 'Intermediate', 'Pro']) {
                        try {
                            const scenarioCount = await Scenario_1.Scenario.countDocuments({
                                game_id: gameId,
                                characters_involved: charId,
                            });
                            if (scenarioCount < 3)
                                continue;
                            const existing = await TheoryDocument_1.TheoryDoc.findOne({
                                game_id: gameId,
                                character_id: charId,
                                target_skill_level: level,
                                type: 'character',
                                is_current_patch: true,
                            }).lean().exec();
                            const needsUpdate = !existing
                                || this.isStale(existing.generated_at, 7)
                                || await this.hasNewScenarios(gameId, charId, existing.generated_at);
                            if (!needsUpdate)
                                continue;
                            console.log(`[AutoResearch] Generating ${level} character theory: ${gameId}/${charId}`);
                            const result = await this.theoryService.generateCharacterTheory(gameId, charId, level);
                            if (result.success && result.data) {
                                characterGenerated++;
                            }
                        }
                        catch (err) {
                            console.error(`[AutoResearch] Failed ${level} character theory ${charId}:`, err);
                        }
                    }
                }
                // ── 2. High-priority matchup gaps ─────────────────────────
                const topChars = await this.getTopCharactersByScenarioCount(gameId, 5);
                for (let i = 0; i < topChars.length; i++) {
                    for (let j = i + 1; j < topChars.length; j++) {
                        const charA = topChars[i];
                        const charB = topChars[j];
                        for (const level of ['Rookie', 'Intermediate', 'Pro']) {
                            try {
                                const scenarioCount = await Scenario_1.Scenario.countDocuments({
                                    game_id: gameId,
                                    characters_involved: { $all: [charA, charB] },
                                });
                                if (scenarioCount < 3)
                                    continue;
                                const [a, b] = [charA, charB].sort();
                                const existing = await TheoryDocument_1.TheoryDoc.findOne({
                                    game_id: gameId,
                                    character_a: a,
                                    character_b: b,
                                    target_skill_level: level,
                                    type: 'matchup',
                                    is_current_patch: true,
                                }).lean().exec();
                                const needsUpdate = !existing
                                    || this.isStale(existing.generated_at, 14)
                                    || await this.hasNewMatchupScenarios(gameId, charA, charB, existing.generated_at);
                                if (!needsUpdate)
                                    continue;
                                console.log(`[AutoResearch] Generating ${level} matchup theory: ${charA} vs ${charB}`);
                                const result = await this.theoryService.generateMatchupTheory(gameId, charA, charB, level);
                                if (result.success && result.data) {
                                    matchupGenerated++;
                                }
                            }
                            catch (err) {
                                console.error(`[AutoResearch] Failed ${level} matchup ${charA} vs ${charB}:`, err);
                            }
                        }
                    }
                }
                // ── 3. Broadcast summary if anything was generated ─────────
                if (characterGenerated + matchupGenerated > 0) {
                    await this.notificationService.broadcast('VECTOR_INSIGHT', {
                        gameId,
                        title: `${game.name} intel updated`,
                        description: `${characterGenerated} character theories and ${matchupGenerated} matchup theories refreshed from latest tournament data.`,
                        link: '/dojo/roster',
                    }, 'medium');
                }
            }
            console.log(`[AutoResearch] Cycle complete — ${characterGenerated} character, ${matchupGenerated} matchup, ${skipped} skipped`);
        }
        catch (err) {
            console.error('[AutoResearch] Cycle failed:', err);
        }
        finally {
            this.isRunning = false;
        }
        return { character: characterGenerated, matchup: matchupGenerated, skipped };
    }
    // ── Helpers ───────────────────────────────────────────────────────────────
    isStale(date, days) {
        const ms = days * 24 * 60 * 60 * 1000;
        return Date.now() - new Date(date).getTime() > ms;
    }
    async hasNewScenarios(gameId, charId, since) {
        const count = await Scenario_1.Scenario.countDocuments({
            game_id: gameId,
            characters_involved: charId,
            created_at: { $gt: since },
        });
        return count > 0;
    }
    async hasNewMatchupScenarios(gameId, charA, charB, since) {
        const count = await Scenario_1.Scenario.countDocuments({
            game_id: gameId,
            characters_involved: { $all: [charA, charB] },
            created_at: { $gt: since },
        });
        return count > 0;
    }
    async getTopCharactersByScenarioCount(gameId, limit) {
        const results = await Scenario_1.Scenario.aggregate([
            { $match: { game_id: gameId } },
            { $unwind: '$characters_involved' },
            { $group: { _id: '$characters_involved', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]);
        return results.map((r) => r._id);
    }
}
exports.AutoResearchService = AutoResearchService;
//# sourceMappingURL=AutoResearchService.js.map