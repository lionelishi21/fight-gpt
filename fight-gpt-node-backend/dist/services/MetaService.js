"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const node_cron_1 = __importDefault(require("node-cron"));
const BaseService_1 = require("./BaseService");
const uuidHelper_1 = require("../helpers/uuidHelper");
/**
 * Character name values that are NOT real character names.
 * These appear in seed data or AI output as placeholders meaning
 * "this scenario applies to all characters" — they must be excluded
 * from tier list / matchup calculations.
 */
const INVALID_CHARACTER_NAMES = new Set([
    'all', 'unknown', 'n/a', 'none', 'any', 'tbd', '?', '',
]);
class MetaService extends BaseService_1.BaseService {
    metaRepository;
    vectorRepository;
    geminiApiKey;
    genAI;
    constructor(metaRepository, vectorRepository, geminiApiKey) {
        super();
        this.metaRepository = metaRepository;
        this.vectorRepository = vectorRepository;
        this.geminiApiKey = geminiApiKey;
        this.genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
    }
    /**
     * Generate a meta report for a game by synthesizing all stored scenarios
     * in the vector DB via Gemini
     */
    async generateMetaReport(gameId, period = 'weekly') {
        const reportId = uuidHelper_1.UuidHelper.generate();
        // Create a placeholder report in 'generating' state
        const placeholder = await this.metaRepository.createReport({
            report_id: reportId,
            game_id: gameId,
            period,
            generated_at: new Date(),
            status: 'generating',
            tier_list: [],
            trending_characters: { rising: [], falling: [] },
            dominant_strategies: [],
            matchup_insights: [],
            meta_summary: '',
            source_scenario_count: 0,
            source_video_count: 0,
        });
        try {
            // Pull all scenarios for this game from MongoDB (not vector search — we want all of them)
            const scenarios = await this.getAllScenariosForGame(gameId);
            if (scenarios.length === 0) {
                await this.metaRepository.updateReport(reportId, {
                    status: 'error',
                    error_message: 'No scenarios found for this game. Ingest some videos first.',
                });
                return {
                    success: false,
                    error: 'No scenarios found. Run video ingestion first.',
                };
            }
            // Build raw stats from scenario data
            const { tierList, matchupInsights, dominantStrategies } = this.buildRawStats(scenarios);
            // Generate narrative meta summary via Gemini
            const metaSummary = await this.generateMetaSummaryWithGemini(gameId, scenarios, tierList, dominantStrategies);
            // Detect trends (compare with previous report if available)
            const previousReport = await this.metaRepository.getLatestReport(gameId, period);
            const tierListWithTrends = this.applyTrends(tierList, previousReport?.tier_list || []);
            const reportData = {
                status: 'ready',
                tier_list: tierListWithTrends,
                trending_characters: {
                    rising: tierListWithTrends.filter(c => c.trend === 'rising').map(c => c.character_id),
                    falling: tierListWithTrends.filter(c => c.trend === 'falling').map(c => c.character_id),
                },
                dominant_strategies: dominantStrategies,
                matchup_insights: matchupInsights,
                meta_summary: metaSummary,
                source_scenario_count: scenarios.length,
                source_video_count: new Set(scenarios.flatMap((s) => s.match_references || [])).size,
                generated_at: new Date(),
            };
            const updated = await this.metaRepository.updateReport(reportId, reportData);
            return {
                success: true,
                data: updated,
                message: `Meta report generated from ${scenarios.length} scenarios`,
            };
        }
        catch (error) {
            await this.metaRepository.updateReport(reportId, {
                status: 'error',
                error_message: error instanceof Error ? error.message : 'Unknown error',
            });
            throw this.handleError(error, 'generateMetaReport');
        }
    }
    /**
     * Get the latest ready meta report for a game
     */
    async getLatestMetaReport(gameId, period) {
        try {
            const report = await this.metaRepository.getLatestReport(gameId, period);
            if (!report) {
                return {
                    success: false,
                    error: `No meta report found for game: ${gameId}. Trigger generation first.`,
                };
            }
            return { success: true, data: report };
        }
        catch (error) {
            throw this.handleError(error, 'getLatestMetaReport');
        }
    }
    /**
     * Get meta report history for a game
     */
    async getMetaReportHistory(gameId, limit = 10) {
        try {
            const reports = await this.metaRepository.getReportHistory(gameId, limit);
            return { success: true, data: reports };
        }
        catch (error) {
            throw this.handleError(error, 'getMetaReportHistory');
        }
    }
    /**
     * Semantic meta query — ask a natural language question about the current meta
     * Uses vector similarity search to find relevant scenarios, then Gemini to answer
     */
    async queryMetaInsight(gameId, query) {
        try {
            // Embed the query
            let queryVector;
            try {
                const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
                const embeddingResult = await embeddingModel.embedContent(query);
                queryVector = embeddingResult.embedding.values;
            }
            catch (embedError) {
                console.warn('[MetaService] Gemini embedding failed, falling back to basic search or error message', embedError);
                return {
                    success: false,
                    error: 'Semantic search quota exceeded or service unavailable. Please try again later or use specific keywords.',
                };
            }
            // Find similar scenarios via Atlas Vector Search
            const similarScenarios = await this.vectorRepository.findSimilarScenarios(queryVector, gameId, 10);
            if (similarScenarios.length === 0) {
                return {
                    success: true,
                    data: {
                        answer: 'Not enough data yet. More videos need to be analyzed for this game before meta insights are available.',
                        scenarios: [],
                    },
                };
            }
            // Build context from scenarios for Gemini
            const scenarioContext = similarScenarios.map((s, i) => `Scenario ${i + 1}: ${s.description}\nAdvice: ${s.context}\nCharacters: ${(s.characters_involved || []).join(' vs ')}`).join('\n\n');
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `You are a fighting game meta analyst. Based on the following match scenarios from real gameplay data, answer this question concisely and specifically:

Question: ${query}

Relevant scenarios from the data:
${scenarioContext}

Provide a direct, actionable answer focused on the current meta. Mention specific characters, moves, or strategies by name where relevant.`;
            const result = await model.generateContent(prompt);
            const answer = result.response.text();
            return {
                success: true,
                data: { answer, scenarios: similarScenarios },
            };
        }
        catch (error) {
            throw this.handleError(error, 'queryMetaInsight');
        }
    }
    /**
     * Start the automated meta synthesis scheduler.
     * Runs at 4am daily — after Karpathy auto-research (2am).
     */
    startScheduler() {
        // Daily at 04:00
        node_cron_1.default.schedule('0 4 * * *', async () => {
            console.log('[MetaService] Starting automated daily meta synthesis...');
            try {
                // Find all active games
                const Game = this.metaRepository.model.db.model('Game');
                const games = await Game.find({ is_active: true }).lean().exec();
                for (const game of games) {
                    console.log(`[MetaService] Synthesising meta for ${game.game_id}...`);
                    await this.generateMetaReport(game.game_id, 'weekly');
                }
                console.log('[MetaService] Daily meta synthesis complete.');
            }
            catch (err) {
                console.error('[MetaService] Automated meta synthesis failed:', err);
            }
        }, { timezone: 'UTC' });
        console.log('[MetaService] Scheduled — runs daily at 04:00 UTC');
    }
    // --- Private helpers ---
    /**
     * Fetch all scenarios for a game directly from MongoDB (not vector search)
     */
    async getAllScenariosForGame(gameId) {
        // VectorRepository uses BaseRepository which has findMany
        return this.vectorRepository.model
            ? this.vectorRepository.model.find({ game_id: gameId }, { embedding: 0 }).lean().exec()
            : [];
    }
    /**
     * Build raw character stats and matchup data from scenarios
     */
    buildRawStats(scenarios) {
        const characterMap = new Map();
        const matchupMap = new Map();
        const allStrategies = [];
        for (const scenario of scenarios) {
            const chars = scenario.characters_involved || [];
            const tags = scenario.tags || [];
            // Count character usage
            for (const char of chars) {
                if (!char)
                    continue;
                // Skip placeholder/garbage values that are not real character names
                const normalized = char.trim().toLowerCase();
                if (INVALID_CHARACTER_NAMES.has(normalized))
                    continue;
                if (!characterMap.has(char)) {
                    characterMap.set(char, { usage: 0, wins: 0, strategies: [] });
                }
                const entry = characterMap.get(char);
                entry.usage++;
                if (tags.includes('pro_move')) {
                    entry.wins++;
                    entry.strategies.push(scenario.description);
                }
            }
            // Track matchups (pair of characters)
            if (chars.length === 2 && chars[0] && chars[1]) {
                const key = [chars[0], chars[1]].sort().join('|');
                if (!matchupMap.has(key)) {
                    matchupMap.set(key, { wins_a: 0, total: 0, strategies: [] });
                }
                const mu = matchupMap.get(key);
                mu.total++;
                // If p1 (chars[0] sorted) has a pro_move it counts as a win for them
                if (tags.includes('pro_move')) {
                    mu.wins_a++;
                    mu.strategies.push(scenario.description);
                }
            }
            // Collect dominant strategies from context
            if (scenario.context) {
                allStrategies.push(scenario.context);
            }
        }
        // Build tier list
        const tierList = Array.from(characterMap.entries())
            .map(([char_id, stats]) => ({
            character_id: char_id,
            character_name: char_id,
            usage_count: stats.usage,
            win_count: stats.wins,
            win_rate: stats.usage > 0 ? Math.round((stats.wins / stats.usage) * 100) : 0,
            trend: 'stable',
            top_strategies: [...new Set(stats.strategies)].slice(0, 3),
        }))
            .sort((a, b) => b.win_rate - a.win_rate);
        // Build matchup insights
        const matchupInsights = Array.from(matchupMap.entries())
            .filter(([, mu]) => mu.total >= 2)
            .map(([key, mu]) => {
            const [char_a, char_b] = key.split('|');
            return {
                character_a: char_a,
                character_b: char_b,
                win_rate_a: mu.total > 0 ? Math.round((mu.wins_a / mu.total) * 100) : 50,
                dominant_strategy: mu.strategies[0] || 'Insufficient data',
                sample_size: mu.total,
            };
        })
            .sort((a, b) => b.sample_size - a.sample_size)
            .slice(0, 20);
        // Deduplicate and pick top dominant strategies
        const strategyFrequency = new Map();
        for (const s of allStrategies) {
            const key = s.slice(0, 80); // Use first 80 chars as key
            strategyFrequency.set(key, (strategyFrequency.get(key) || 0) + 1);
        }
        const dominantStrategies = Array.from(strategyFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([s]) => s);
        return { tierList, matchupInsights, dominantStrategies };
    }
    /**
     * Compare current tier list to previous to detect rising/falling characters
     */
    applyTrends(current, previous) {
        const prevMap = new Map(previous.map((c, i) => [c.character_id, i]));
        return current.map((char, currentRank) => {
            const prevRank = prevMap.get(char.character_id);
            if (prevRank === undefined)
                return { ...char, trend: 'stable' };
            if (currentRank < prevRank)
                return { ...char, trend: 'rising' };
            if (currentRank > prevRank)
                return { ...char, trend: 'falling' };
            return { ...char, trend: 'stable' };
        });
    }
    /**
     * Use Gemini to write a human-readable meta summary from the raw stats
     */
    async generateMetaSummaryWithGemini(gameId, scenarios, tierList, dominantStrategies) {
        try {
            const topChars = tierList.slice(0, 5).map(c => `${c.character_name} (win rate: ${c.win_rate}%, usage: ${c.usage_count})`).join(', ');
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `You are a professional fighting game meta analyst. Based on ${scenarios.length} analyzed matches for ${gameId}, write a concise 2-3 paragraph meta report covering:

1. The current top tier characters and why they dominate
2. Key dominant strategies and win conditions
3. What players should know going into ranked play right now

Data:
- Top characters: ${topChars}
- Dominant strategies observed: ${dominantStrategies.join('; ')}

Write in a professional, direct tone like a tier list article. Be specific about characters and strategies.`;
            const result = await model.generateContent(prompt);
            return result.response.text();
        }
        catch {
            return `Meta report generated from ${scenarios.length} analyzed scenarios. Top characters by win rate: ${tierList.slice(0, 3).map(c => c.character_name).join(', ')}.`;
        }
    }
}
exports.MetaService = MetaService;
//# sourceMappingURL=MetaService.js.map