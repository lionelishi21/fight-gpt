import { BaseRepository } from './BaseRepository';
import { Analysis, IAnalysis } from '../models/Analysis';
import { AnalysisRequest, AnalysisResponse } from '../types';

/**
 * Analysis repository interface extending base repository
 * Follows Interface Segregation Principle (ISP) - specific interface for analysis operations
 */
export interface IAnalysisRepository {
  findByYouTubeUrl(youtubeUrl: string): Promise<IAnalysis | null>;
  findByVideoPath(videoPath: string): Promise<IAnalysis | null>;
  findByAnalysisId(analysisId: string): Promise<IAnalysis | null>;
  getRecentAnalyses(limit: number, userId?: string): Promise<IAnalysis[]>;
  createAnalysis(request: AnalysisRequest, response: AnalysisResponse, analysisId: string, userId?: string): Promise<IAnalysis>;
}

/**
 * Analysis repository implementation
 * Follows Single Responsibility Principle - handles only analysis data operations
 * Follows Open/Closed Principle - extends BaseRepository without modifying it
 */
export class AnalysisRepository extends BaseRepository<IAnalysis> implements IAnalysisRepository {
  constructor() {
    super(Analysis);
  }

  /**
   * Find analysis by YouTube URL
   */
  async findByYouTubeUrl(youtubeUrl: string): Promise<IAnalysis | null> {
    return this.findOne({ youtube_url: youtubeUrl, video_source: 'youtube' });
  }

  /**
   * Find analysis by video path
   */
  async findByVideoPath(videoPath: string): Promise<IAnalysis | null> {
    return this.findOne({ video_path: videoPath, video_source: 'local_file' });
  }

  /**
   * Find analysis by analysis ID
   */
  async findByAnalysisId(analysisId: string): Promise<IAnalysis | null> {
    return this.findOne({ analysis_id: analysisId });
  }

  /**
   * Get recent analyses
   */
  async getRecentAnalyses(limit: number, userId?: string): Promise<IAnalysis[]> {
    const filter = userId ? { user_id: userId } : {};
    return this.findMany(filter, { sort: { createdAt: -1 }, limit });
  }

  /**
   * Create new analysis record
   */
  async createAnalysis(
    request: AnalysisRequest,
    response: AnalysisResponse,
    analysisId: string,
    userId?: string
  ): Promise<IAnalysis> {
    const videoSource = request.youtube_url ? 'youtube' : 'local_file';
    const data: Partial<IAnalysis> = {
      youtube_url: request.youtube_url,
      video_path: request.video_path,
      video_source: videoSource,
      game_id: request.game_id,
      analysis: response,
      analysis_id: analysisId,
      ...(userId ? { user_id: userId } : {}),
    };

    return this.create(data);
  }
}

