import { BaseRepository } from './BaseRepository';
import { IAnalysis } from '../models/Analysis';
import { AnalysisRequest, AnalysisResponse } from '../types';
/**
 * Analysis repository interface extending base repository
 * Follows Interface Segregation Principle (ISP) - specific interface for analysis operations
 */
export interface IAnalysisRepository {
    findByYouTubeUrl(youtubeUrl: string): Promise<IAnalysis | null>;
    findByVideoPath(videoPath: string): Promise<IAnalysis | null>;
    findByAnalysisId(analysisId: string): Promise<IAnalysis | null>;
    getRecentAnalyses(limit: number, userId?: string, gameId?: string): Promise<IAnalysis[]>;
    createAnalysis(request: AnalysisRequest, response: AnalysisResponse, analysisId: string, userId?: string): Promise<IAnalysis>;
    countRecentAnalysesByUser(userId: string, hours: number): Promise<number>;
    getDiscoveryAnalyses(limit: number, gameId?: string, p1Char?: string, p2Char?: string): Promise<IAnalysis[]>;
    incrementViewCount(analysisId: string): Promise<void>;
    incrementClickCount(analysisId: string): Promise<void>;
}
/**
 * Analysis repository implementation
 * Follows Single Responsibility Principle - handles only analysis data operations
 * Follows Open/Closed Principle - extends BaseRepository without modifying it
 */
export declare class AnalysisRepository extends BaseRepository<IAnalysis> implements IAnalysisRepository {
    constructor();
    /**
     * Find analysis by YouTube URL
     */
    findByYouTubeUrl(youtubeUrl: string): Promise<IAnalysis | null>;
    /**
     * Find analysis by video path
     */
    findByVideoPath(videoPath: string): Promise<IAnalysis | null>;
    /**
     * Find analysis by analysis ID
     */
    findByAnalysisId(analysisId: string): Promise<IAnalysis | null>;
    /**
     * Get recent analyses
     */
    getRecentAnalyses(limit: number, userId?: string, gameId?: string): Promise<IAnalysis[]>;
    /**
     * Create new analysis record
     */
    createAnalysis(request: AnalysisRequest, response: AnalysisResponse, analysisId: string, userId?: string): Promise<IAnalysis>;
    /**
     * Count analyses created by a user within a certain time window
     */
    countRecentAnalysesByUser(userId: string, hours: number): Promise<number>;
    /**
     * Get analyses for the discovery feed with optional matchup filtering
     */
    getDiscoveryAnalyses(limit: number, gameId?: string, p1Char?: string, p2Char?: string): Promise<IAnalysis[]>;
    /**
     * Increment view count for a discovery record
     */
    incrementViewCount(analysisId: string): Promise<void>;
    /**
     * Increment click count for a discovery record
     */
    incrementClickCount(analysisId: string): Promise<void>;
}
//# sourceMappingURL=AnalysisRepository.d.ts.map