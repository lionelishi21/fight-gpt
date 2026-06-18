import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Storage } from '@google-cloud/storage';
import { AnalysisRequest, AnalysisResponse, AiUsageRecord } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
import { VersionResolver } from '../helpers/VersionResolver';
import { AppConfig } from '../config/app';
import { IVectorRepository } from '../repositories/VectorRepository';
import { GeminiCreditExhaustedError } from '../errors';
import { checkGeminiCreditBudget } from './AdminService';
import { createAnalysisGraph } from '../pipelines/analysisGraph';

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
  private readonly graph: ReturnType<typeof createAnalysisGraph>;

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

    // LangGraph pipeline — handles screen → flash → pro routing with LangSmith tracing
    this.graph = createAnalysisGraph({
      vectorRepository,
      generateEmbedding: this.generateEmbedding.bind(this),
      apiKey: apiKey || AppConfig.GEMINI_API_KEY,
      modelName,
    });
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
      // gcsUri stays null; the graph will use request.youtube_url as fileUri.

      // Check credit budget before kicking off any Gemini calls
      const budget = await checkGeminiCreditBudget().catch(() => ({ allowed: true, spentUsd: 0, budgetUsd: 50 }));
      if (!budget.allowed) {
        throw new GeminiCreditExhaustedError(budget.spentUsd, budget.budgetUsd);
      }

      // Run the LangGraph pipeline — screen → flash → pro (LangSmith traces each stage)
      const state = await this.graph.invoke({ request, videoUri: gcsUri });

      // Cleanup GCS file after analysis (only applies to local file uploads)
      if (fileName) {
        await this.deleteFromGcs(fileName).catch(e => console.warn('[AiService] GCS Cleanup failed:', e));
      }

      if (state.stage === 'rejected') {
        const reason = state.screenResult?.rejection_reason || 'Video does not contain fighting game gameplay';
        throw Object.assign(new Error(reason), { name: 'NotGameplayError', reason });
      }

      if (!state.analysis) {
        throw new Error('Analysis graph completed without producing a result');
      }

      // Attach stage usage summary so downstream cost tracking still works
      const result: AnalysisResponse = {
        ...state.analysis,
        ai_usage: {
          records: state.usage.map(u => ({
            stage: u.stage as AiUsageRecord['stage'],
            model: u.model,
            prompt_tokens: 0,
            candidates_tokens: 0,
            total_tokens: 0,
          })),
          total_tokens: 0,
        },
      };

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


