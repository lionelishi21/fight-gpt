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
 * AI Service implementation (Google Cloud Vertex AI)
 */
class AiService extends BaseService_1.BaseService {
    genAI;
    model;
    modelName;
    gameMetadataService;
    characterEncyclopediaService;
    constructor(apiKey, modelName, gameMetadataService, characterEncyclopediaService) {
        super();
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required for AiService');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
        this.model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: { responseMimeType: 'application/json' }
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
        }
        catch (error) {
            if (fileName) {
                try {
                    await this.deleteFromGcs(fileName);
                }
                catch { }
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
        const contentParts = [];
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
            const result = await this.model.generateContent(contentParts);
            const responseText = result.response.text() || '';
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
            const model = this.vertexAI.getGenerativeModel({ model: 'text-embedding-004' });
            // In @google-cloud/vertexai, the method is embedContent but the response structure 
            // might differ slightly from the AI Studio SDK.
            const result = await model.embedContent({
                content: { role: 'user', parts: [{ text }] }
            });
            return result.embeddings?.[0]?.values || result.embedding?.values || [];
        }
        catch (error) {
            throw this.handleError(error, 'generateEmbedding');
        }
    }
}
exports.AiService = AiService;
//# sourceMappingURL=AiService.js.map