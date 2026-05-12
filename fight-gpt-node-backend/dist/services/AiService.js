"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const storage_1 = require("@google-cloud/storage");
const BaseService_1 = require("./BaseService");
const VersionResolver_1 = require("../helpers/VersionResolver");
const app_1 = require("../config/app");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * AI Service implementation using Google Generative AI SDK (API key-based auth)
 * Migrated from Vertex AI to avoid service account key requirement.
 */
class AiService extends BaseService_1.BaseService {
    genAI;
    model;
    modelName;
    gameMetadataService;
    characterEncyclopediaService;
    storage;
    constructor(apiKey, modelName, gameMetadataService, characterEncyclopediaService) {
        super();
        this.modelName = modelName;
        // Use Google AI API key — no service account needed
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey || app_1.AppConfig.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: { responseMimeType: 'application/json' },
        });
        this.storage = new storage_1.Storage({
            projectId: app_1.AppConfig.GOOGLE_CLOUD_PROJECT,
        });
        this.gameMetadataService = gameMetadataService;
        this.characterEncyclopediaService = characterEncyclopediaService;
    }
    /**
     * Analyze video using Vertex AI Gemini
     */
    async analyzeVideo(request) {
        let gcsUri = null;
        let fileName = null;
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
        }
        catch (error) {
            if (fileName) {
                try {
                    await this.deleteFromGcs(fileName);
                }
                catch { }
            }
            if (error && error.name === 'YoutubeBotBlockError') {
                throw error;
            }
            throw this.handleError(error, 'analyzeVideo');
        }
        finally {
            if (request.video_path && fs.existsSync(request.video_path)) {
                try {
                    fs.unlinkSync(request.video_path);
                }
                catch { }
            }
        }
    }
    async uploadToGcs(filePath, destination) {
        if (!app_1.AppConfig.GOOGLE_STORAGE_BUCKET) {
            throw new Error('GOOGLE_STORAGE_BUCKET is required for video analysis');
        }
        const bucket = this.storage.bucket(app_1.AppConfig.GOOGLE_STORAGE_BUCKET);
        await bucket.upload(filePath, {
            destination,
            metadata: { contentType: 'video/mp4' },
        });
        return `gs://${app_1.AppConfig.GOOGLE_STORAGE_BUCKET}/${destination}`;
    }
    async deleteFromGcs(fileName) {
        if (!app_1.AppConfig.GOOGLE_STORAGE_BUCKET)
            return;
        await this.storage.bucket(app_1.AppConfig.GOOGLE_STORAGE_BUCKET).file(fileName).delete();
    }
    async generateAnalysis(videoUri, request) {
        const prompt = VersionResolver_1.VersionResolver.resolvePrompt('v1');
        let fullPrompt = prompt;
        if (request.ai_context) {
            fullPrompt += `\n\nContext:\n${request.ai_context}`;
        }
        if (request.video_title) {
            fullPrompt += `\n\nVideo Title: ${request.video_title}`;
        }
        const contentParts = [];
        // Pass video to Gemini:
        // 1. GCS URI for local file uploads
        // 2. YouTube URL directly — @google/generative-ai supports YouTube URLs natively
        if (videoUri && videoUri.startsWith('gs://')) {
            const mimeType = videoUri.endsWith('.webm') ? 'video/webm' : 'video/mp4';
            contentParts.push({ fileData: { mimeType, fileUri: videoUri } });
        }
        else if (request.youtube_url) {
            // Gemini fetches YouTube internally — no download or bot detection needed
            contentParts.push({ fileData: { fileUri: request.youtube_url } });
        }
        contentParts.push({ text: fullPrompt });
        try {
            const result = await this.model.generateContent({ contents: [{ role: 'user', parts: contentParts }] });
            const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const sanitizedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            try {
                return JSON.parse(sanitizedJson);
            }
            catch (e) {
                console.error('Failed to parse Gemini response', responseText);
                throw new Error('Invalid JSON response from Gemini API');
            }
        }
        catch (e) {
            throw this.handleError(e, 'generateAnalysis');
        }
    }
    /**
     * Verify mission proof video
     */
    async verifyMissionProof(videoUrl, missionData) {
        try {
            let prompt = VersionResolver_1.VersionResolver.resolvePrompt('v1_mission_proof');
            prompt = prompt
                .replace('{{title}}', missionData.title)
                .replace('{{description}}', missionData.description)
                .replace('{{criteria}}', JSON.stringify(missionData.criteria || 'Standard execution.'));
            const contentParts = [
                { text: `Proof Video: ${videoUrl}` },
                { text: prompt }
            ];
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: contentParts }]
            });
            const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const sanitizedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(sanitizedJson);
        }
        catch (error) {
            throw this.handleError(error, 'verifyMissionProof');
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        return true;
    }
    /**
     * Get game metadata
     */
    async getGameMetadata(gameId) {
        try {
            const result = await this.gameMetadataService.getCurrentGameMetadataByGameId(gameId);
            return result.success ? (result.data ?? null) : null;
        }
        catch (error) {
            console.error(`Failed to fetch game metadata:`, error);
            return null;
        }
    }
    async getCharacterGameRules(gameId, characterId) {
        try {
            const result = await this.characterEncyclopediaService.getGameRules(gameId, characterId);
            return result.success ? (result.data ?? null) : null;
        }
        catch (error) {
            return null;
        }
    }
    async getGameConstants(gameId) {
        const meta = await this.getGameMetadata(gameId);
        return meta?.constants || null;
    }
    async getGlobalMechanics(gameId) {
        const meta = await this.getGameMetadata(gameId);
        return meta?.global_mechanics || null;
    }
    async generateEmbedding(text) {
        try {
            const embedModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
            const embedResult = await embedModel.embedContent(text);
            return embedResult.embedding.values;
        }
        catch (error) {
            throw this.handleError(error, 'generateEmbedding');
        }
    }
}
exports.AiService = AiService;
//# sourceMappingURL=AiService.js.map