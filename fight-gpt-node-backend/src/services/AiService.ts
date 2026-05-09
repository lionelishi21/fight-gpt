import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import { Storage } from '@google-cloud/storage';
import { AnalysisRequest, AnalysisResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { VersionResolver } from '../helpers/VersionResolver';
import { AppConfig } from '../config/app';

import * as path from 'path';
import * as fs from 'fs';

/**
 * AI Service interface
 */
export interface IAiService {
  analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse>;
  verifyMissionProof(videoUrl: string, missionData: { title: string; description: string; criteria?: any }): Promise<any>;
  healthCheck(): Promise<boolean>;
  getGameMetadata(gameId: string): Promise<IGameMetadata | null>;
  getCharacterGameRules(gameId: string, characterId: string): Promise<CharacterGameRule[] | null>;
  getGameConstants(gameId: string): Promise<Record<string, unknown> | null>;
  getGlobalMechanics(gameId: string): Promise<GameRule[] | null>;
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * AI Service implementation (Google Cloud Vertex AI)
 */
export class AiService extends BaseService implements IAiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;
  private readonly gameMetadataService: IGameMetadataService;
  private readonly characterEncyclopediaService: ICharacterEncyclopediaService;

  constructor(
    apiKey: string,
    modelName: string,
    gameMetadataService: IGameMetadataService,
    characterEncyclopediaService: ICharacterEncyclopediaService
  ) {
    super();
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for AiService');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    this.storage = new Storage({
      projectId: AppConfig.GOOGLE_CLOUD_PROJECT,
    });

    this.gameMetadataService = gameMetadataService;
    this.characterEncyclopediaService = characterEncyclopediaService;
  }

  /**
   * Analyze video using Vertex AI Gemini
   */
  async analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse> {
    let gcsUri: string | null = null;
    let fileName: string | null = null;

    try {
      if (!request.video_path && !request.youtube_url) {
        throw new Error('Video path or YouTube URL is required for analysis');
      }

      // If a local file is provided, upload to GCS
      if (request.video_path) {
        fileName = `analysis/${Date.now()}-${path.basename(request.video_path)}`;
        gcsUri = await this.uploadToGcs(request.video_path, fileName);
      }

      // Generate analysis using the GCS URI or YouTube URL
      const result = await this.generateAnalysis(gcsUri, request);

      // Cleanup GCS file after analysis
      if (fileName) {
        await this.deleteFromGcs(fileName).catch(e => console.warn('[AiService] GCS Cleanup failed:', e));
      }

      return result;

    } catch (error) {
      if (fileName) {
        try { await this.deleteFromGcs(fileName); } catch {}
      }
      throw this.handleError(error, 'analyzeVideo');
    } finally {
      if (request.video_path && fs.existsSync(request.video_path)) {
        try { fs.unlinkSync(request.video_path); } catch {}
      }
    }
  }

  private async uploadToGcs(filePath: string, destination: string): Promise<string> {
    if (!AppConfig.GOOGLE_STORAGE_BUCKET) {
      throw new Error('GOOGLE_STORAGE_BUCKET is required for video analysis');
    }

    const bucket = this.storage.bucket(AppConfig.GOOGLE_STORAGE_BUCKET);
    await bucket.upload(filePath, {
      destination,
      metadata: { contentType: 'video/mp4' },
    });

    return `gs://${AppConfig.GOOGLE_STORAGE_BUCKET}/${destination}`;
  }

  private async deleteFromGcs(fileName: string): Promise<void> {
    if (!AppConfig.GOOGLE_STORAGE_BUCKET) return;
    await this.storage.bucket(AppConfig.GOOGLE_STORAGE_BUCKET).file(fileName).delete();
  }

  private async generateAnalysis(videoUri: string | null, request: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = VersionResolver.resolvePrompt('v1');

    let fullPrompt = prompt;
    if (request.ai_context) {
      fullPrompt += `\n\nContext:\n${request.ai_context}`;
    }

    const contentParts: any[] = [];
    
    // If we have a video (YouTube), add it to the parts
    // Note: Google AI Studio Gemini models in 2026 support direct YouTube URLs in prompts
    const finalUri = videoUri || request.youtube_url;
    if (finalUri) {
        contentParts.push({
            text: `Video source: ${finalUri}`
        });
    }

    contentParts.push({ text: fullPrompt });

    try {
      const result = await this.model.generateContent(contentParts);
      const responseText = result.response.text() || '';
      const sanitizedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(sanitizedJson) as AnalysisResponse;
      } catch (e) {
        console.error('Failed to parse Gemini response', responseText);
        throw new Error('Invalid JSON response from Gemini API');
      }
    } catch (e: any) {
      throw this.handleError(e, 'generateAnalysis');
    }
  }

  /**
   * Verify mission proof video
   */
  async verifyMissionProof(videoUrl: string, missionData: { title: string; description: string; criteria?: any }): Promise<any> {
    try {
      let prompt = VersionResolver.resolvePrompt('v1_mission_proof');
      
      prompt = prompt
        .replace('{{title}}', missionData.title)
        .replace('{{description}}', missionData.description)
        .replace('{{criteria}}', JSON.stringify(missionData.criteria || 'Standard execution.'));

      const contentParts: any[] = [
        { text: `Proof Video: ${videoUrl}` },
        { text: prompt }
      ];

      const result = await this.model.generateContent(contentParts);
      const responseText = result.response.text() || '';
      const sanitizedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(sanitizedJson);
    } catch (error) {
      throw this.handleError(error, 'verifyMissionProof');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Get game metadata
   */
  async getGameMetadata(gameId: string): Promise<IGameMetadata | null> {
    try {
      const result = await this.gameMetadataService.getCurrentGameMetadataByGameId(gameId);
      return result.success ? (result.data ?? null) : null;
    } catch (error) {
      console.error(`Failed to fetch game metadata:`, error);
      return null;
    }
  }

  async getCharacterGameRules(gameId: string, characterId: string): Promise<CharacterGameRule[] | null> {
    try {
      const result = await this.characterEncyclopediaService.getGameRules(gameId, characterId);
      return result.success ? (result.data ?? null) : null;
    } catch (error) {
      return null;
    }
  }

  async getGameConstants(gameId: string): Promise<Record<string, unknown> | null> {
    const meta = await this.getGameMetadata(gameId);
    return meta?.constants || null;
  }

  async getGlobalMechanics(gameId: string): Promise<GameRule[] | null> {
    const meta = await this.getGameMetadata(gameId);
    return meta?.global_mechanics || null;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw this.handleError(error, 'generateEmbedding');
    }
  }
}


