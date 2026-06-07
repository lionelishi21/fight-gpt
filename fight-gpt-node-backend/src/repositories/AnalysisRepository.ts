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
    // Primary lookup by UUID analysis_id; fall back to MongoDB _id for older links
    const byUuid = await this.findOne({ analysis_id: analysisId });
    if (byUuid) return byUuid;
    try {
      return await this.findOne({ _id: analysisId });
    } catch {
      return null;
    }
  }

  /**
   * Get recent analyses
   */
  async getRecentAnalyses(limit: number, userId?: string, gameId?: string): Promise<IAnalysis[]> {
    const filter: any = {};
    if (userId) filter.user_id = userId;
    if (gameId) filter.game_id = gameId;
    
    return this.findMany(filter, { sort: { created_at: -1 }, limit });
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
      p1_name: response.p1_name,
      p2_name: response.p2_name,
      ...(userId ? { user_id: userId } : {}),
    };

    // If an analysis with the same analysis_id already exists, update it instead of creating a new one
    const existing = await this.model.findOne({ analysis_id: analysisId });
    if (existing) {
      const updated = await this.model.findOneAndUpdate(
        { analysis_id: analysisId },
        { $set: data },
        { new: true }
      );
      if (updated) return updated;
    }

    return this.create(data);
  }

  /**
   * Count analyses created by a user within a certain time window
   */
  async countRecentAnalysesByUser(userId: string, hours: number): Promise<number> {
    const dateLimit = new Date();
    dateLimit.setHours(dateLimit.getHours() - hours);
    
    return this.model.countDocuments({
      user_id: userId,
      created_at: { $gte: dateLimit }
    });
  }

  /**
   * Get analyses for the discovery feed with optional matchup filtering
   */
  async getDiscoveryAnalyses(
    limit: number,
    gameId?: string,
    p1Char?: string,
    p2Char?: string
  ): Promise<IAnalysis[]> {
    const filter: any = { video_source: 'youtube' };
    if (gameId) filter.game_id = gameId;

    if (p1Char && p2Char) {
      // Specific matchup (bidirectional)
      filter.$or = [
        { 'analysis.p1_character': p1Char, 'analysis.p2_character': p2Char },
        { 'analysis.p1_character': p2Char, 'analysis.p2_character': p1Char },
      ];
    } else if (p1Char) {
      // Any vs p1Char
      filter.$or = [
        { 'analysis.p1_character': p1Char },
        { 'analysis.p2_character': p1Char },
      ];
    }

    return this.findMany(filter, { sort: { created_at: -1 }, limit });
  }

  /**
   * Increment view count for a discovery record
   */
  async incrementViewCount(analysisId: string): Promise<void> {
    await this.model.updateOne(
      { $or: [{ analysis_id: analysisId }, { _id: analysisId }] },
      { $inc: { view_count: 1 } }
    );
  }

  /**
   * Increment click count for a discovery record
   */
  async incrementClickCount(analysisId: string): Promise<void> {
    await this.model.updateOne(
      { $or: [{ analysis_id: analysisId }, { _id: analysisId }] },
      { $inc: { click_count: 1 } }
    );
  }
}

