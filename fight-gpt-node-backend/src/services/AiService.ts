import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { AnalysisRequest, AnalysisResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { VersionResolver } from '../helpers/VersionResolver';

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    let localVideoPath: string | null = null;
    let uploadResponse = null;

    try {
      if (!request.video_path && !request.youtube_url) {
        throw new Error('Video path or YouTube URL is required for analysis');
      }

      const videoFilePath = request.video_path ?? (
        request.youtube_url ? await this.downloadYouTubeVideo(request.youtube_url) : null
      );

      if (videoFilePath) {
        if (request.youtube_url) localVideoPath = videoFilePath;
        uploadResponse = await this.uploadToGemini(videoFilePath);
        await this.waitForProcessing(uploadResponse.file.name);
      }

      const result = await this.generateAnalysis(uploadResponse, request);

      if (uploadResponse) {
        await this.fileManager.deleteFile(uploadResponse.file.name);
      }

      return result;

    } catch (error) {
      if (uploadResponse) {
        try { await this.fileManager.deleteFile(uploadResponse.file.name); } catch {}
      }
      throw this.handleError(error, 'analyzeVideo');
    } finally {
      if (localVideoPath && fs.existsSync(localVideoPath)) {
        try { fs.unlinkSync(localVideoPath); } catch {}
      }
    }
  }

  private async downloadYouTubeVideo(url: string): Promise<string> {
    const tmpDir = os.tmpdir();
    const outTemplate = path.join(tmpDir, 'fgpt_%(id)s.%(ext)s');

    const strategies = [
      `yt-dlp -f "best[ext=mp4]/best" --no-playlist -o "${outTemplate}" "${url}"`,
      `yt-dlp -f "worst[ext=mp4]/best" --no-playlist --extractor-args "youtube:player_client=android" -o "${outTemplate}" "${url}"`,
      `yt-dlp -f "best" --no-playlist --extractor-args "youtube:player_client=ios,web" -o "${outTemplate}" "${url}"`,
    ];

    let lastError: Error | null = null;
    for (const cmd of strategies) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 120_000 });
        // yt-dlp prints the final path — parse it
        const match = stdout.match(/\[download\] Destination: (.+)|Merging formats into "(.+)"/);
        if (match) {
          const p = (match[1] || match[2]).trim();
          if (fs.existsSync(p)) return p;
        }
        // Fallback: search tmpdir for recent fgpt_ file
        const files = fs.readdirSync(tmpDir)
          .filter(f => f.startsWith('fgpt_'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(tmpDir, f)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        if (files.length > 0) return path.join(tmpDir, files[0].name);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    throw new Error(
      lastError?.message?.includes('available') || lastError?.message?.includes('removed')
        ? 'This video is unavailable or has been removed from YouTube.'
        : `Failed to download video: ${lastError?.message}`
    );
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
    const prompt = VersionResolver.resolvePrompt('v1');

    let fullPrompt = prompt;
    if (request.ai_context) {
      fullPrompt += `\n\nContext:\n${request.ai_context}`;
    }

    const contentParts: any[] = [];
    if (fileResponse) {
      contentParts.push({
        fileData: { mimeType: fileResponse.mimeType, fileUri: fileResponse.uri },
      });
    }
    contentParts.push({ text: fullPrompt });

    // Try primary model, fall back on 503/overload
    const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    const modelsToTry = [this.modelName, ...FALLBACK_MODELS.filter(m => m !== this.modelName)];
    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(contentParts);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
          return JSON.parse(responseText) as AnalysisResponse;
        } catch (e) {
          console.error('Failed to parse Gemini response', responseText);
          throw new Error('Invalid JSON response from AI');
        }
      } catch (e: any) {
        lastError = e;
        const is503 = e?.message?.includes('503') || e?.message?.includes('overload') || e?.message?.includes('high demand');
        if (!is503) throw e; // non-transient errors bubble immediately
      }
    }

    throw lastError ?? new Error('All Gemini models failed');
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw this.handleError(error, 'generateEmbedding');
    }
  }
}

