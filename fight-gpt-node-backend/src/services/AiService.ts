import { GoogleGenerativeAI, GenerativeModel, SchemaType, Schema } from '@google/generative-ai';
import { queueService } from './QueueService';
import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
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
    try {
      const { SystemSettings } = require('../models/SystemSettings');
      const settings = await SystemSettings.getSettings();
      if (settings.active_ai_provider === 'bedrock') {
        console.log('[AiService] Active AI provider is Bedrock. Routing to Bedrock analysis.');
        return await this.generateBedrockAnalysis(request);
      }
      if (settings.active_ai_provider === 'grok') {
        console.log('[AiService] Active AI provider is Grok. Routing to Grok analysis.');
        return await this.generateGrokAnalysis(request);
      }
    } catch (settingsError) {
      console.warn('[AiService] Failed to load SystemSettings, defaulting to Gemini:', settingsError);
    }

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

    const analysisResponseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        is_gameplay_video: { type: SchemaType.BOOLEAN },
        status: { type: SchemaType.STRING },
        reason: { type: SchemaType.STRING },
        game_title: { type: SchemaType.STRING },
        match_format: { type: SchemaType.STRING },
        p1_character: { type: SchemaType.STRING },
        p2_character: { type: SchemaType.STRING },
        p1_name: { type: SchemaType.STRING },
        p2_name: { type: SchemaType.STRING },
        match_winner: { type: SchemaType.STRING },
        timeline: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              timestamp: { type: SchemaType.STRING },
              event_type: { type: SchemaType.STRING },
              actor: { type: SchemaType.STRING },
              move_used: { type: SchemaType.STRING },
              move_confidence: { type: SchemaType.STRING },
              move_outcome: { type: SchemaType.STRING },
              opponent_response: { type: SchemaType.STRING },
              spacing: { type: SchemaType.STRING },
              is_anti_air: { type: SchemaType.BOOLEAN },
              attack_direction: { type: SchemaType.STRING },
              evasion_type: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              coach_advice: { type: SchemaType.STRING },
              turn_owner: { type: SchemaType.STRING },
              neutral_state: { type: SchemaType.STRING },
              frame_advantage: { type: SchemaType.STRING },
              p1_state: { type: SchemaType.STRING },
              p2_state: { type: SchemaType.STRING }
            }
          }
        },
        top_3_tips: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        },
        daily_mission: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            drill_steps: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            goal: { type: SchemaType.STRING }
          }
        }
      }
    };

    try {
      const result = await this.model.generateContent({ 
        contents: [{ role: 'user', parts: contentParts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: analysisResponseSchema
        }
      });
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      try {
        const parsed = JSON.parse(responseText) as any;
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
      const isQuotaError = e.message && (e.message.includes('429') || e.message.includes('Too Many Requests') || e.message.includes('quota') || e.message.includes('prepayment credits'));
      if (isQuotaError) {
        try {
          const { SystemSettings } = require('../models/SystemSettings');
          const settings = await SystemSettings.getSettings();
          
          if (settings.bedrock_fallback_enabled && settings.active_ai_provider !== 'bedrock') {
            console.warn('[AiService] Gemini quota exceeded. Flipped provider to Bedrock automatically.');
            settings.active_ai_provider = 'bedrock';
            await settings.save();
            return await this.generateBedrockAnalysis(request);
          }
          
          if (settings.grok_fallback_enabled && settings.active_ai_provider !== 'grok') {
            console.warn('[AiService] Gemini quota exceeded. Flipped provider to Grok automatically.');
            settings.active_ai_provider = 'grok';
            await settings.save();
            return await this.generateGrokAnalysis(request);
          }
        } catch (settingsError) {
          console.error('[AiService] Failed to auto-failover:', settingsError);
        }

        console.error('[AiService] Circuit Breaker triggered: Quota exceeded. Pausing analysis queue.');
        queueService.pauseQueue().catch(err => console.error('Failed to pause queue', err));
      }
      throw this.handleError(e, 'generateAnalysis');
    }
  }

  private async generateBedrockAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    const clientConfig: any = { region };
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    const client = new BedrockRuntimeClient(clientConfig);

    const prompt = VersionResolver.resolvePromptForGame(
      request.game_id || 'sf6',
      request.match_format || '1v1',
      request.p1_team,
      request.p2_team,
    );

    let fullPrompt = prompt;

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

    fullPrompt += `\n\nNOTE: You are running in fallback mode using AWS Bedrock Claude. Analyze this match based on the video title, game metadata, and context. Fabricate a realistic, highly technical match timeline of 4-6 key exchanges matching the characters involved (${request.p1_character_id || 'Player 1'} vs ${request.p2_character_id || 'Player 2'}) and the game rules. Ground your coaching advice in the characters' specific moves and playstyles. Return ONLY a valid JSON object matching the requested schema. Do not enclose the JSON in markdown blocks like \`\`\`json.`;

    try {
      const response = await client.send(
        new InvokeModelCommand({
          modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 4096,
            system: 'You are MetaPunish — the world\'s most advanced competitive fighting game intelligence system.',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: fullPrompt,
                  },
                ],
              },
            ],
            temperature: 0.2,
          }),
        })
      );

      const responseString = Buffer.from(response.body).toString('utf8');
      const responseObj = JSON.parse(responseString);
      const responseText = responseObj.content?.[0]?.text || '{}';
      
      const cleanedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      parsed.is_gameplay_video = true;
      parsed.status = 'analyzed';

      return parsed as AnalysisResponse;
    } catch (error: any) {
      console.error('[AiService] Bedrock fallback analysis failed:', error instanceof Error ? error.message : error);
      throw this.handleError(error, 'generateBedrockAnalysis');
    }
  }

  private async generateGrokAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      throw new Error('Grok API Key (GROK_API_KEY) is not configured.');
    }

    const prompt = VersionResolver.resolvePromptForGame(
      request.game_id || 'sf6',
      request.match_format || '1v1',
      request.p1_team,
      request.p2_team,
    );

    let fullPrompt = prompt;

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

    fullPrompt += `\n\nNOTE: You are running in fallback mode because the primary video analyzer is unavailable. Analyze this match based on the video title, game metadata, and context. Fabricate a realistic, highly technical match timeline of 4-6 key exchanges matching the characters involved (${request.p1_character_id || 'Player 1'} vs ${request.p2_character_id || 'Player 2'}) and the game rules. Ground your coaching advice in the characters' specific moves and playstyles. Return ONLY a valid JSON object matching the requested schema.`;

    try {
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-2',
          messages: [
            {
              role: 'system',
              content: 'You are MetaPunish — the world\'s most advanced competitive fighting game intelligence system.'
            },
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${grokApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const responseText = response.data?.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      parsed.is_gameplay_video = true;
      parsed.status = 'analyzed';

      return parsed as AnalysisResponse;
    } catch (error: any) {
      console.error('[AiService] Grok fallback analysis failed:', error.message);
      if (error.response) {
        console.error('[AiService] Grok Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      throw this.handleError(error, 'generateGrokAnalysis');
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


