import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';
import mongoose from 'mongoose';
import { BaseService } from './BaseService';
import { IMetaRepository } from '../repositories/MetaRepository';
import { IVectorRepository } from '../repositories/VectorRepository';
import { IMetaReport, ICharacterMetaStat, IMatchupInsight } from '../models/MetaReport';
import { ApiResponse } from '../types';
import { UuidHelper } from '../helpers/uuidHelper';

export interface IMetaService {
    generateMetaReport(gameId: string, period?: 'weekly' | 'patch' | 'monthly'): Promise<ApiResponse<IMetaReport>>;
    getLatestMetaReport(gameId: string, period?: string): Promise<ApiResponse<IMetaReport>>;
    getMetaReportHistory(gameId: string, limit?: number): Promise<ApiResponse<IMetaReport[]>>;
    queryMetaInsight(gameId: string, query: string): Promise<ApiResponse<{ answer: string; scenarios: unknown[] }>>;
    startScheduler(): void;
}

/**
 * Character name values that are NOT real character names.
 * These appear in seed data or AI output as placeholders meaning
 * "this scenario applies to all characters" — they must be excluded
 * from tier list / matchup calculations.
 */
const INVALID_CHARACTER_NAMES = new Set([
    'all', 'unknown', 'n/a', 'none', 'any', 'tbd', '?', '',
    'p1', 'p2', 'player 1', 'player 2', 'player1', 'player2',
]);

const KNOWN_CHARACTERS: Record<string, string[]> = {
    sf6: ['ryu','ken','chun-li','guile','cammy','juri','kimberly','manon','dee_jay','jp',
          'lily','marisa','rashid','aki','ed','akuma','m_bison','bison','terry','honda',
          'dhalsim','blanka','zangief','luke','jamie','sagat','vega','balrog','cody','poison'],
    tekken8: ['kazuya','jin','paul','law','king','yoshimitsu','nina','hwoarang','xiaoyu',
              'heihachi','devil_jin','asuka','lili','lars','alisa','lee','steve','dragunov',
              'victor','reina','azucena','raven','leo'],
    ggst: ['sol','ky','may','axl','chipp','potemkin','faust','millia','zato','ramlethal',
           'leo','nagoriyuki','giovanna','anji','happy_chaos','baiken','testament','bridget'],
    mk1: ['scorpion','sub-zero','liu_kang','kung_lao','kitana','mileena','raiden','baraka',
          'johnny_cage','kenshi','reptile','shang_tsung','geras','sindel','havik','smoke',
          'rain','reiko','general_shao','tanya','ashrah'],
};

function extractCharactersFromText(text: string, gameId: string): string[] {
    if (!text) return [];
    const chars = KNOWN_CHARACTERS[gameId] || [];
    const lower = text.toLowerCase();
    const found = new Set<string>();
    for (const name of chars) {
        const esc = name.replace(/[-]/g, '[-_]?');
        if (new RegExp(`(?<![a-z_])${esc}(?![a-z_])`, 'i').test(lower)) found.add(name);
    }
    return Array.from(found);
}

export class MetaService extends BaseService implements IMetaService {
    private genAI: GoogleGenerativeAI;

    constructor(
        private readonly metaRepository: IMetaRepository,
        private readonly vectorRepository: IVectorRepository,
        private readonly geminiApiKey: string,
    ) {
        super();
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
    }

    /**
     * Generate a meta report for a game by synthesizing all stored scenarios
     * in the vector DB via Gemini
     */
    async generateMetaReport(
        gameId: string,
        period: 'weekly' | 'patch' | 'monthly' = 'weekly'
    ): Promise<ApiResponse<IMetaReport>> {
        const reportId = UuidHelper.generate();

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
                } as any);
                return {
                    success: false,
                    error: 'No scenarios found. Run video ingestion first.',
                };
            }

            // Build raw stats from scenario data (uses extracted characters)
            const { tierList: scenarioTierList, matchupInsights, dominantStrategies } = this.buildRawStats(scenarios);

            // Augment with analysis collection stats (authoritative character names)
            const analysisStats = await this.getCharacterStatsFromAnalyses(gameId);
            const mergedMap = new Map<string, { usage: number; wins: number; strategies: string[] }>();
            for (const e of scenarioTierList) mergedMap.set(e.character_id, { usage: e.usage_count, wins: e.win_count, strategies: e.top_strategies });
            for (const [id, as] of analysisStats.entries()) {
                if (mergedMap.has(id)) { mergedMap.get(id)!.usage += as.usage; mergedMap.get(id)!.wins += as.wins; }
                else mergedMap.set(id, { usage: as.usage, wins: as.wins, strategies: [] });
            }
            const tierList: ICharacterMetaStat[] = Array.from(mergedMap.entries())
                .map(([char_id, s]) => ({ character_id: char_id, character_name: char_id, usage_count: s.usage, win_count: s.wins, win_rate: s.usage > 0 ? Math.round((s.wins / s.usage) * 100) : 0, trend: 'stable' as const, top_strategies: s.strategies.slice(0, 3) }))
                .sort((a, b) => b.usage_count - a.usage_count);

            // Generate narrative meta summary via Gemini
            const metaSummary = await this.generateMetaSummaryWithGemini(
                gameId,
                scenarios,
                tierList,
                dominantStrategies
            );

            // Detect trends (compare with previous report if available)
            const previousReport = await this.metaRepository.getLatestReport(gameId, period);
            const tierListWithTrends = this.applyTrends(tierList, previousReport?.tier_list || []);

            const reportData: Partial<IMetaReport> = {
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
                source_video_count: new Set(scenarios.flatMap((s: any) => s.match_references || [])).size,
                generated_at: new Date(),
            };

            const updated = await this.metaRepository.updateReport(reportId, reportData as any);

            return {
                success: true,
                data: updated as unknown as IMetaReport,
                message: `Meta report generated from ${scenarios.length} scenarios`,
            };
        } catch (error) {
            await this.metaRepository.updateReport(reportId, {
                status: 'error',
                error_message: error instanceof Error ? error.message : 'Unknown error',
            } as any);
            throw this.handleError(error, 'generateMetaReport');
        }
    }

    /**
     * Get the latest ready meta report for a game
     */
    async getLatestMetaReport(gameId: string, period?: string): Promise<ApiResponse<IMetaReport>> {
        try {
            const report = await this.metaRepository.getLatestReport(gameId, period);
            if (!report) {
                return {
                    success: false,
                    error: `No meta report found for game: ${gameId}. Trigger generation first.`,
                };
            }
            return { success: true, data: report as unknown as IMetaReport };
        } catch (error) {
            throw this.handleError(error, 'getLatestMetaReport');
        }
    }

    /**
     * Get meta report history for a game
     */
    async getMetaReportHistory(gameId: string, limit: number = 10): Promise<ApiResponse<IMetaReport[]>> {
        try {
            const reports = await this.metaRepository.getReportHistory(gameId, limit);
            return { success: true, data: reports as unknown as IMetaReport[] };
        } catch (error) {
            throw this.handleError(error, 'getMetaReportHistory');
        }
    }

    /**
     * Semantic meta query — ask a natural language question about the current meta
     * Uses vector similarity search to find relevant scenarios, then Gemini to answer
     */
    async queryMetaInsight(
        gameId: string,
        query: string
    ): Promise<ApiResponse<{ answer: string; scenarios: unknown[] }>> {
        try {
            // Embed the query
            let queryVector;
            try {
                const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
                const embeddingResult = await embeddingModel.embedContent(query);
                queryVector = embeddingResult.embedding.values;
            } catch (embedError) {
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
            const scenarioContext = similarScenarios.map((s: any, i: number) =>
                `Scenario ${i + 1}: ${s.description}\nAdvice: ${s.context}\nCharacters: ${(s.characters_involved || []).join(' vs ')}`
            ).join('\n\n');

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
        } catch (error) {
            throw this.handleError(error, 'queryMetaInsight');
        }
    }

    /**
     * Start the automated meta synthesis scheduler.
     * Runs at 4am daily — after Karpathy auto-research (2am).
     */
    startScheduler(): void {
        // Daily at 04:00
        cron.schedule('0 4 * * *', async () => {
            console.log('[MetaService] Starting automated daily meta synthesis...');
            try {
                // Find all active games
                const Game = (this.metaRepository as any).model.db.model('Game');
                const games = await Game.find({ is_active: true }).lean().exec();

                for (const game of games) {
                    console.log(`[MetaService] Synthesising meta for ${game.game_id}...`);
                    await this.generateMetaReport(game.game_id, 'weekly');
                }
                console.log('[MetaService] Daily meta synthesis complete.');
            } catch (err) {
                console.error('[MetaService] Automated meta synthesis failed:', err);
            }
        }, { timezone: 'UTC' });
        
        console.log('[MetaService] Scheduled — runs daily at 04:00 UTC');
    }

    // --- Private helpers ---

    /**
     * Build raw character stats and matchup data from scenarios
     */
    private buildRawStats(scenarios: any[]): {
        tierList: ICharacterMetaStat[];
        matchupInsights: IMatchupInsight[];
        dominantStrategies: string[];
    } {
        const characterMap = new Map<string, { usage: number; wins: number; strategies: string[] }>();
        const matchupMap = new Map<string, { wins_a: number; total: number; strategies: string[] }>();
        const allStrategies: string[] = [];

        for (const scenario of scenarios) {
            const chars: string[] = scenario.characters_involved || [];
            const tags: string[] = scenario.tags || [];

            // Count character usage
            for (const char of chars) {
                if (!char) continue;
                // Skip placeholder/garbage values that are not real character names
                const normalized = char.trim().toLowerCase();
                if (INVALID_CHARACTER_NAMES.has(normalized)) continue;

                if (!characterMap.has(char)) {
                    characterMap.set(char, { usage: 0, wins: 0, strategies: [] });
                }
                const entry = characterMap.get(char)!;
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
                const mu = matchupMap.get(key)!;
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
        const tierList: ICharacterMetaStat[] = Array.from(characterMap.entries())
            .map(([char_id, stats]) => ({
                character_id: char_id,
                character_name: char_id,
                usage_count: stats.usage,
                win_count: stats.wins,
                win_rate: stats.usage > 0 ? Math.round((stats.wins / stats.usage) * 100) : 0,
                trend: 'stable' as const,
                top_strategies: [...new Set(stats.strategies)].slice(0, 3),
            }))
            .sort((a, b) => b.win_rate - a.win_rate);

        // Build matchup insights
        const matchupInsights: IMatchupInsight[] = Array.from(matchupMap.entries())
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
        const strategyFrequency = new Map<string, number>();
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
    private applyTrends(
        current: ICharacterMetaStat[],
        previous: ICharacterMetaStat[]
    ): ICharacterMetaStat[] {
        const prevMap = new Map(previous.map((c, i) => [c.character_id, i]));
        return current.map((char, currentRank) => {
            const prevRank = prevMap.get(char.character_id);
            if (prevRank === undefined) return { ...char, trend: 'stable' as const };
            if (currentRank < prevRank) return { ...char, trend: 'rising' as const };
            if (currentRank > prevRank) return { ...char, trend: 'falling' as const };
            return { ...char, trend: 'stable' as const };
        });
    }

    /**
     * Use Gemini to write a human-readable meta summary from the raw stats
     */
    private async generateMetaSummaryWithGemini(
        gameId: string,
        scenarios: unknown[],
        tierList: ICharacterMetaStat[],
        dominantStrategies: string[]
    ): Promise<string> {
        try {
            const topChars = tierList.slice(0, 5).map(c =>
                `${c.character_name} (win rate: ${c.win_rate}%, usage: ${c.usage_count})`
            ).join(', ');

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
        } catch {
            return `Meta report generated from ${scenarios.length} analyzed scenarios. Top characters by win rate: ${tierList.slice(0, 3).map(c => c.character_name).join(', ')}.`;
        }
    }

    /**
     * Fetch scenarios and backfill characters_involved from context text for legacy scenarios
     * that have empty arrays due to Gemini returning P1/P2 placeholders.
     */
    private async getAllScenariosForGame(gameId: string): Promise<unknown[]> {
        const model = (this.vectorRepository as any).model;
        if (!model) return [];

        try {
            const empty = await model.find(
                { game_id: gameId, characters_involved: { $size: 0 } },
                { _id: 1, context: 1, description: 1 }
            ).lean().exec();

            if (empty.length > 0) {
                const ops: any[] = [];
                for (const s of empty) {
                    const chars = extractCharactersFromText(
                        `${(s as any).context || ''} ${(s as any).description || ''}`, gameId
                    );
                    if (chars.length > 0) {
                        ops.push({ updateOne: { filter: { _id: (s as any)._id }, update: { $set: { characters_involved: chars } } } });
                    }
                }
                if (ops.length > 0) await model.bulkWrite(ops);
            }
        } catch (e) {
            // non-fatal
        }

        return model.find({ game_id: gameId }, { embedding: 0 }).lean().exec();
    }

    /**
     * Get character usage/win stats from Analysis collection (authoritative source).
     * Scenarios often have P1/P2 placeholders; analyses store the actual Gemini character names.
     */
    private async getCharacterStatsFromAnalyses(gameId: string): Promise<Map<string, { usage: number; wins: number }>> {
        const stats = new Map<string, { usage: number; wins: number }>();
        try {
            const AnalysisModel = mongoose.models['Analysis'];
            if (!AnalysisModel) return stats;
            const analyses = await AnalysisModel.find(
                { game_id: gameId },
                { 'analysis.p1_character': 1, 'analysis.p2_character': 1, 'analysis.match_winner': 1 }
            ).lean().exec();

            for (const doc of analyses) {
                const a = (doc as any).analysis || {};
                const p1 = typeof a.p1_character === 'string' ? a.p1_character.trim().toLowerCase() : null;
                const p2 = typeof a.p2_character === 'string' ? a.p2_character.trim().toLowerCase() : null;
                const winner = typeof a.match_winner === 'string' ? a.match_winner.trim().toLowerCase() : null;

                for (const [char, isWinner] of [[p1, winner === 'p1'], [p2, winner === 'p2']] as [string|null, boolean][]) {
                    if (!char || INVALID_CHARACTER_NAMES.has(char)) continue;
                    const normalized = char.replace(/[\s-]+/g, '_');
                    if (!stats.has(normalized)) stats.set(normalized, { usage: 0, wins: 0 });
                    const entry = stats.get(normalized)!;
                    entry.usage++;
                    if (isWinner) entry.wins++;
                }
            }
        } catch (e) {
            // non-fatal
        }
        return stats;
    }
}
