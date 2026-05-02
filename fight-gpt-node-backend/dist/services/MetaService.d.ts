import { BaseService } from './BaseService';
import { IMetaRepository } from '../repositories/MetaRepository';
import { IVectorRepository } from '../repositories/VectorRepository';
import { ICharacterRepository } from '../repositories/CharacterRepository';
import { IMetaReport } from '../models/MetaReport';
import { ApiResponse } from '../types';
export interface IMetaService {
    generateMetaReport(gameId: string, period?: 'weekly' | 'patch' | 'monthly'): Promise<ApiResponse<IMetaReport>>;
    getLatestMetaReport(gameId: string, period?: string): Promise<ApiResponse<IMetaReport>>;
    getMetaReportHistory(gameId: string, limit?: number): Promise<ApiResponse<IMetaReport[]>>;
    queryMetaInsight(gameId: string, query: string): Promise<ApiResponse<{
        answer: string;
        scenarios: unknown[];
    }>>;
    startScheduler(): void;
}
export declare class MetaService extends BaseService implements IMetaService {
    private readonly metaRepository;
    private readonly vectorRepository;
    private readonly geminiApiKey;
    private readonly characterRepository?;
    private genAI;
    constructor(metaRepository: IMetaRepository, vectorRepository: IVectorRepository, geminiApiKey: string, characterRepository?: ICharacterRepository);
    /**
     * Generate a meta report for a game by synthesizing all stored scenarios
     * in the vector DB via Gemini
     */
    generateMetaReport(gameId: string, period?: 'weekly' | 'patch' | 'monthly'): Promise<ApiResponse<IMetaReport>>;
    /**
     * Get the latest ready meta report for a game
     */
    getLatestMetaReport(gameId: string, period?: string): Promise<ApiResponse<IMetaReport>>;
    /**
     * Get meta report history for a game
     */
    getMetaReportHistory(gameId: string, limit?: number): Promise<ApiResponse<IMetaReport[]>>;
    /**
     * Semantic meta query — ask a natural language question about the current meta
     * Uses vector similarity search to find relevant scenarios, then Gemini to answer
     */
    queryMetaInsight(gameId: string, query: string): Promise<ApiResponse<{
        answer: string;
        scenarios: unknown[];
    }>>;
    /**
     * Start the automated meta synthesis scheduler.
     * Runs at 4am daily — after Karpathy auto-research (2am).
     */
    startScheduler(): void;
    /**
     * Build raw character stats and matchup data from scenarios
     */
    private buildRawStats;
    /**
     * Compare current tier list to previous to detect rising/falling characters
     */
    private applyTrends;
    /**
     * Use Gemini to write a human-readable meta summary from the raw stats
     */
    private generateMetaSummaryWithGemini;
    /**
     * Returns all character name variants for a game, preferring DB over hardcoded list.
     * Cached per call — single DB round-trip per meta generation run.
     */
    private getKnownCharacters;
    /**
     * Fetch scenarios and backfill characters_involved from context text for legacy scenarios
     * that have empty arrays due to Gemini returning P1/P2 placeholders.
     * Uses DB character names when available so new games/DLC are covered without a deploy.
     */
    private getAllScenariosForGame;
    /**
     * Get character usage/win stats from Analysis collection (authoritative source).
     * Scenarios often have P1/P2 placeholders; analyses store the actual Gemini character names.
     */
    private getCharacterStatsFromAnalyses;
}
//# sourceMappingURL=MetaService.d.ts.map