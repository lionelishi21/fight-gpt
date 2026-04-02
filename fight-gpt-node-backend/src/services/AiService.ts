import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { AnalysisRequest, AnalysisResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { VersionResolver } from '../helpers/VersionResolver';

import * as path from 'path';

/**
 * AI Service interface
 */
export interface IAiService {
  analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse>;
  healthCheck(): Promise<boolean>;
  getGameMetadata(gameId: string): Promise<IGameMetadata | null>;
  getCharacterGameRules(gameId: string, characterId: string): Promise<CharacterGameRule[] | null>;
  getGameConstants(gameId: string): Promise<Record<string, unknown> | null>;
  getGlobalMechanics(gameId: string): Promise<GameRule[] | null>;
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * AI Service implementation (Node.js Unified Stack)
 */
export class AiService extends BaseService implements IAiService {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private modelName: string;
  private readonly gameMetadataService: IGameMetadataService;
  private readonly characterEncyclopediaService: ICharacterEncyclopediaService;

  constructor(
    apiKey: string,
    modelName: string = 'gemini-1.5-flash',
    gameMetadataService: IGameMetadataService,
    characterEncyclopediaService: ICharacterEncyclopediaService
  ) {
    super();
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.modelName = modelName;
    this.gameMetadataService = gameMetadataService;
    this.characterEncyclopediaService = characterEncyclopediaService;
  }

  /**
   * Analyze video using Gemini Native API
   */
  async analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      if (!request.video_path && !request.youtube_url) {
        throw new Error('Video path or YouTube URL is required for analysis');
      }

      let uploadResponse = null;

      if (request.video_path) {
        // 1. Upload Video to Gemini
        uploadResponse = await this.uploadToGemini(request.video_path);

        // 2. Wait for Processing
        await this.waitForProcessing(uploadResponse.file.name);
      }

      // 3. Generate Content
      const result = await this.generateAnalysis(uploadResponse, request);

      if (uploadResponse) {
        // 4. Cleanup
        await this.fileManager.deleteFile(uploadResponse.file.name);
      }

      return result;

    } catch (error) {
      throw this.handleError(error, 'analyzeVideo');
    }
  }

  private async uploadToGemini(filePath: string) {
    return await this.fileManager.uploadFile(filePath, {
      mimeType: 'video/mp4',
      displayName: path.basename(filePath),
    });
  }

  private async waitForProcessing(fileName: string) {
    let file = await this.fileManager.getFile(fileName);
    while (file.state === FileState.PROCESSING) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await this.fileManager.getFile(fileName);
    }
    if (file.state === FileState.FAILED) {
      throw new Error('Video processing failed');
    }
  }

  private async generateAnalysis(fileResponse: any | null, request: AnalysisRequest): Promise<AnalysisResponse> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = VersionResolver.resolvePrompt('v1'); // Use VersionResolver

    // Enhance prompt with context if available
    let fullPrompt = prompt;
    if (request.ai_context) {
      fullPrompt += `\n\nContext:\n${request.ai_context}`;
    }

    // Inject YouTube URL into the prompt instructions if provided
    if (request.youtube_url) {
      fullPrompt += `\n\nWatch this video and analyze it: ${request.youtube_url}`;
    }

    const contentParts: any[] = [];

    // Add local uploaded video file if available
    if (fileResponse) {
      contentParts.push({
        fileData: {
          mimeType: fileResponse.mimeType,
          fileUri: fileResponse.uri,
        },
      });
    }

    contentParts.push({ text: fullPrompt });

    const result = await model.generateContent(contentParts);

    let responseText = result.response.text();
    try {
      // Clean up markdown code blocks if present (Gemini sometimes still adds these even with application/json)
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(responseText) as AnalysisResponse;
    } catch (e) {
      console.error('Failed to parse Gemini response', responseText);
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return true; // Simple check since we are using Library
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
      // Use the text-embedding-004 model
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw this.handleError(error, 'generateEmbedding');
    }
  }
}

