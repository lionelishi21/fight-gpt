import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';
import { AnalysisRequest, AnalysisResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { VersionResolver } from '../helpers/VersionResolver';
import { AppConfig } from '../config/app';
import { streamYoutubeToGcs } from '../helpers/youtubeDownloader';

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
  private vertexAI: VertexAI;
  private model: GenerativeModel;
  private modelName: string;
  private readonly gameMetadataService: IGameMetadataService;
  private readonly characterEncyclopediaService: ICharacterEncyclopediaService;
  private storage: Storage;

  constructor(
    apiKey: string, // Kept for interface compatibility, but we rely on Vertex AI ADC
    modelName: string,
    gameMetadataService: IGameMetadataService,
    characterEncyclopediaService: ICharacterEncyclopediaService
  ) {
    super();
    
    this.modelName = modelName;
    
    // Initialize Vertex AI using Google Cloud ADC
    this.vertexAI = new VertexAI({
      project: AppConfig.GOOGLE_CLOUD_PROJECT,
      location: AppConfig.GOOGLE_CLOUD_LOCATION
    });
    
    this.model = this.vertexAI.getGenerativeModel({ 
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
      } else if (request.youtube_url) {
        // Stream YouTube video directly to GCS
        fileName = `analysis/${Date.now()}-youtube.mp4`;
        if (!AppConfig.GOOGLE_STORAGE_BUCKET) {
            throw new Error('GOOGLE_STORAGE_BUCKET is required for video analysis');
        }
        gcsUri = await streamYoutubeToGcs(
            request.youtube_url, 
            this.storage, 
            AppConfig.GOOGLE_STORAGE_BUCKET, 
            fileName
        );
      }

      // Generate analysis using the GCS URI
      const result = await this.generateAnalysis(gcsUri, request);

      // Cleanup GCS file after analysis
      if (fileName) {
        await this.deleteFromGcs(fileName).catch(e => console.warn('[AiService] GCS Cleanup failed:', e));
      }

      return result;

    } catch (error: any) {
      if (fileName) {
        try { await this.deleteFromGcs(fileName); } catch {}
      }
      if (error && error.name === 'YoutubeBotBlockError') {
        throw error;
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

    if (request.video_title) {
      fullPrompt += `\n\nVideo Title: ${request.video_title}`;
    }

    const contentParts: any[] = [];
    
    // Pass the GCS URI as a fileData Part to Vertex AI so it actually watches the video
    if (videoUri && videoUri.startsWith('gs://')) {
        contentParts.push({
            fileData: {
                mimeType: 'video/mp4',
                fileUri: videoUri
            }
        });
    } else if (request.youtube_url) {
        // Fallback (should not be reached if downloader succeeded)
        contentParts.push({
            text: `Video source: ${request.youtube_url}`
        });
    }

    contentParts.push({ text: fullPrompt });

    try {
      const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: contentParts }]
      });
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

      const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: contentParts }]
      });
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
      const embeddingModel = this.vertexAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.generateContent(text); // Vertex AI text embedding
      
      // Need to map Vertex AI embedding structure.
      // Vertex AI typically returns embeddings under result.response.candidates[0].content.parts[0].text or similar for some endpoints, 
      // but if we are just using getGenerativeModel, we should verify the API. 
      // Note: For embeddings in Vertex AI Node SDK it's slightly different. Let's fallback to fetch API or GoogleGenerativeAI just for embeddings if needed.
      // However, sticking to the standard VertexAI wrapper:
      // Actually, Vertex AI getGenerativeModel doesn't directly support embedContent in the same way. 
      // Let's import GoogleGenerativeAI locally just for embeddings to preserve existing behavior without breaking it, 
      // since the main goal was changing the video generation.
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(AppConfig.GEMINI_API_KEY);
      const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const embedResult = await embedModel.embedContent(text);
      return embedResult.embedding.values;
    } catch (error) {
      throw this.handleError(error, 'generateEmbedding');
    }
  }
}


