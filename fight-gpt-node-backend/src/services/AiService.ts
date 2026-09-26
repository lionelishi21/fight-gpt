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
import { IPlayerTendencyRepository } from '../repositories/PlayerTendencyRepository';

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
  generatePerspectiveCoaching(
    rawEvents: any[],
    perspective: 'p1' | 'p2',
    gameId: string,
    character: string | undefined,
    opponentCharacter: string | undefined,
    context?: string
  ): Promise<any>;
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
  private lastHealthCheck: { result: boolean; checkedAt: number } | null = null;
  private static readonly HEALTH_CHECK_TTL_MS = 60_000;

  constructor(
    apiKey: string,
    modelName: string,
    gameMetadataService: IGameMetadataService,
    characterEncyclopediaService: ICharacterEncyclopediaService,
    vectorRepository?: IVectorRepository,
    playerTendencyRepository?: IPlayerTendencyRepository
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
    // fallbackApiKey (GEMINI_API_KEY_2) is used automatically when primary hits 429
    this.graph = createAnalysisGraph({
      vectorRepository,
      generateEmbedding: this.generateEmbedding.bind(this),
      apiKey: apiKey || AppConfig.GEMINI_API_KEY,
      fallbackApiKey: AppConfig.GEMINI_API_KEY_2 || undefined,
      modelName,
      characterEncyclopediaService,
      gameMetadataService,
      playerTendencyRepository,
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
  /**
   * Actually pings Gemini rather than always returning true. Cached for
   * HEALTH_CHECK_TTL_MS so frequent /api/health hits (load balancers, deploy
   * scripts) don't themselves burn Gemini quota — at most one real call per minute.
   */
  async healthCheck(): Promise<boolean> {
    const now = Date.now();
    if (this.lastHealthCheck && now - this.lastHealthCheck.checkedAt < AiService.HEALTH_CHECK_TTL_MS) {
      return this.lastHealthCheck.result;
    }

    let result: boolean;
    try {
      const pingModel = this.genAI.getGenerativeModel({ model: this.modelName });
      const response = await pingModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 5 },
      });
      result = !!response.response.candidates?.length;
    } catch (err) {
      console.warn('[AiService] healthCheck Gemini ping failed:', err instanceof Error ? err.message : err);
      result = false;
    }

    this.lastHealthCheck = { result, checkedAt: now };
    return result;
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

  async generatePerspectiveCoaching(
    rawEvents: any[],
    perspective: 'p1' | 'p2',
    gameId: string,
    character: string | undefined,
    opponentCharacter: string | undefined,
    context?: string
  ): Promise<any> {
    const prompt = `You are an expert fighting game coach. Analyze this objective match timeline from the perspective of ${perspective.toUpperCase()} (${character || 'Unknown Character'}) playing against ${opponentCharacter || 'Unknown Character'} in ${gameId}.

${context ? 'Game Context:\n' + context + '\n\n' : ''}
Timeline Events:
${JSON.stringify(rawEvents, null, 2)}

Go beyond describing what happened. Each tip and each piece of event advice should say what to do differently and why.${context && context.includes('META SNAPSHOT') ? `
A META SNAPSHOT is provided above. Tie at least two of the three tips to it: the matchup plan against ${opponentCharacter || 'the opponent'}, what the current meta rewards or punishes for ${character || 'this character'}, and how the player's choices in the timeline compare with the common strategies listed. Only cite numbers and strategies that appear in the snapshot; if the sample is small, say so instead of overstating it.` : ''}

Return ONLY valid JSON in the following format:
{
  "top_3_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "daily_mission": {
    "title": "Mission name",
    "drill_steps": ["Step 1", "Step 2"],
    "goal": "Goal description"
  },
  "coaching_by_event": {
    "evt-001": {
      "description": "What happened to you.",
      "coach_advice": "Actionable advice for this situation."
    }
  }
}
Note: The keys in coaching_by_event must exactly match the node_id from the timeline events.`;

    // Overload (503 "high demand") is usually gone within seconds; retry briefly
    // so a spike doesn't drop the coaching for an otherwise finished analysis.
    let result;
    for (let attempt = 0; ; attempt++) {
      try {
        result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        break;
      } catch (err: any) {
        const overloaded = err?.status === 503 || /\b503\b|high demand|UNAVAILABLE/i.test(String(err?.message || err));
        if (!overloaded || attempt >= 2) throw err;
        await new Promise(resolve => setTimeout(resolve, [2000, 6000][attempt]));
      }
    }

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const sanitizedJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(sanitizedJson);
  }
}


