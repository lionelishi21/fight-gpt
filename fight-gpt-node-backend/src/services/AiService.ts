import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Storage } from '@google-cloud/storage';
import { AnalysisRequest, AnalysisResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { VersionResolver } from '../helpers/VersionResolver';
import { AppConfig } from '../config/app';
import { IVectorRepository } from '../repositories/VectorRepository';

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
 * AI Service implementation using Google Generative AI SDK (API key-based auth)
 * Migrated from Vertex AI to avoid service account key requirement.
 */
export class AiService extends BaseService implements IAiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;
  private readonly gameMetadataService: IGameMetadataService;
  private readonly characterEncyclopediaService: ICharacterEncyclopediaService;
  private readonly vectorRepository?: IVectorRepository;
  private storage: Storage;

  constructor(
    apiKey: string,
    modelName: string,
    gameMetadataService: IGameMetadataService,
    characterEncyclopediaService: ICharacterEncyclopediaService,
    vectorRepository?: IVectorRepository
  ) {
    super();
    this.modelName = modelName;

    // Use Google AI API key — no service account needed
    this.genAI = new GoogleGenerativeAI(apiKey || AppConfig.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });

    this.storage = new Storage({
      projectId: AppConfig.GOOGLE_CLOUD_PROJECT,
    });

    this.gameMetadataService = gameMetadataService;
    this.characterEncyclopediaService = characterEncyclopediaService;
    this.vectorRepository = vectorRepository;
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

      // If a local file is provided, upload to GCS first
      if (request.video_path) {
        fileName = `analysis/${Date.now()}-${path.basename(request.video_path)}`;
        gcsUri = await this.uploadToGcs(request.video_path, fileName);
      }
      // For YouTube URLs: pass directly to Gemini — it supports YouTube URLs natively.
      // This completely bypasses any download/bot-detection issues.
      // gcsUri stays null; generateAnalysis will use request.youtube_url as fileUri.

      // Generate analysis — Gemini will use YouTube URL or GCS URI
      const result = await this.generateAnalysis(gcsUri, request);

      // Cleanup GCS file after analysis (only applies to local file uploads)
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
    const prompt = VersionResolver.resolvePromptForGame(
      request.game_id || 'sf6',
      request.match_format || '1v1',
      request.p1_team,
      request.p2_team,
    );

    let fullPrompt = prompt;

    // Inject top-3 similar pro-match scenarios as few-shot examples before the main prompt.
    // This grounds Gemini in real match data from the vector DB instead of generic training knowledge.
    const fewShotBlock = await this.buildFewShotBlock(request).catch(() => '');
    if (fewShotBlock) {
      fullPrompt = fewShotBlock + '\n\n' + fullPrompt;
    }

    if (request.ai_context) {
      fullPrompt += `\n\nContext:\n${request.ai_context}`;
    }

    if (request.video_title) {
      fullPrompt += `\n\nVideo Title: ${request.video_title}`;
    }

    const contentParts: any[] = [];

    // Pass video to Gemini:
    // 1. GCS URI for local file uploads
    // 2. YouTube URL directly — @google/generative-ai supports YouTube URLs natively
    if (videoUri && videoUri.startsWith('gs://')) {
      const mimeType = videoUri.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      contentParts.push({ fileData: { mimeType, fileUri: videoUri } });
    } else if (request.youtube_url) {
      // Gemini fetches YouTube internally — no download or bot detection needed
      contentParts.push({ fileData: { fileUri: request.youtube_url } });
    }

    contentParts.push({ text: fullPrompt });

    try {
      const result = await this.model.generateContent({ contents: [{ role: 'user', parts: contentParts }] });
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const sanitizedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(sanitizedJson) as any;
        // Reject non-gameplay content before it pollutes the DB
        if (parsed.is_gameplay_video === false || parsed.status === 'not_gameplay') {
          const reason = parsed.reason || 'Video does not contain fighting game gameplay';
          throw Object.assign(new Error(reason), { name: 'NotGameplayError', reason });
        }
        return parsed as AnalysisResponse;
      } catch (e: any) {
        if (e.name === 'NotGameplayError') throw e;
        console.error('Failed to parse Gemini response', responseText);
        throw new Error('Invalid JSON response from Gemini API');
      }
    } catch (e: any) {
      throw this.handleError(e, 'generateAnalysis');
    }
  }

  private async buildFewShotBlock(request: AnalysisRequest): Promise<string> {
    if (!this.vectorRepository) return '';

    const gameId = request.game_id || 'sf6';
    const teamChars = (t?: { point: string; assist1: string; assist2: string }) =>
      t ? [t.point, t.assist1, t.assist2].filter(Boolean) : [];
    const characters = [
      ...teamChars(request.p1_team),
      ...teamChars(request.p2_team),
      request.p1_character_id,
      request.p2_character_id,
    ].filter((c): c is string => Boolean(c));

    const contextText = characters.length
      ? `${gameId} match: ${characters.join(' vs ')}`
      : `${gameId} high level tournament match`;

    const embedding = await this.generateEmbedding(contextText);
    const scenarios = await this.vectorRepository.findSimilarScenarios(embedding, gameId, 3);

    if (!scenarios.length) return '';

    const examples = scenarios
      .map((s, i) => {
        const chars = s.characters_involved?.join(' vs ') || 'unknown';
        const tags = s.tags?.join(', ') || '';
        return `Example ${i + 1} [${chars}${tags ? ` | ${tags}` : ''}]:\n  Context: ${s.context}\n  Description: ${s.description}`;
      })
      .join('\n\n');

    return `REFERENCE SCENARIOS FROM PRO MATCH DATABASE (use these as calibration examples for analysis quality and terminology):\n\n${examples}\n\n---`;
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

      const contentParts: any[] = [];

      // Pass the proof video to Gemini for real visual analysis — same as generateAnalysis.
      // Passing the URL as plain text means Gemini never watches the footage.
      if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
        contentParts.push({ fileData: { fileUri: videoUrl } });
      } else if (videoUrl) {
        // Non-YouTube URL — pass as text fallback (screenshot links, GCP storage, etc.)
        contentParts.push({ text: `Proof footage: ${videoUrl}` });
      }

      contentParts.push({ text: prompt });

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
      // Use gemini-embedding-001 as confirmed by model listing
      const embedModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const embedResult = await embedModel.embedContent(text);
      return embedResult.embedding.values;
    } catch (error) {
      throw this.handleError(error, 'generateEmbedding');
    }
  }
}


