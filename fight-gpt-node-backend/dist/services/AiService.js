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
const server_1 = require("@google/generative-ai/server");
const BaseService_1 = require("./BaseService");
const VersionResolver_1 = require("../helpers/VersionResolver");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * AI Service implementation (Node.js Unified Stack)
 */
class AiService extends BaseService_1.BaseService {
    genAI;
    fileManager;
    modelName;
    gameMetadataService;
    characterEncyclopediaService;
    constructor(apiKey, modelName = 'gemini-2.5-flash', gameMetadataService, characterEncyclopediaService) {
        super();
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.fileManager = new server_1.GoogleAIFileManager(apiKey);
        this.modelName = modelName;
        this.gameMetadataService = gameMetadataService;
        this.characterEncyclopediaService = characterEncyclopediaService;
    }
    /**
     * Analyze video using Gemini Native API
     */
    async analyzeVideo(request) {
        let localVideoPath = null;
        let uploadResponse = null;
        try {
            if (!request.video_path && !request.youtube_url) {
                throw new Error('Video path or YouTube URL is required for analysis');
            }
            // If a local file is provided, we must upload it using GoogleAIFileManager
            if (request.video_path) {
                localVideoPath = request.video_path;
                uploadResponse = await this.uploadToGemini(localVideoPath);
                await this.waitForProcessing(uploadResponse.file.name);
            }
            // Pass the uploaded file OR the direct YouTube URL to generateAnalysis
            const result = await this.generateAnalysis(uploadResponse, request);
            if (uploadResponse) {
                await this.fileManager.deleteFile(uploadResponse.file.name);
            }
            return result;
        }
        catch (error) {
            if (uploadResponse) {
                try {
                    await this.fileManager.deleteFile(uploadResponse.file.name);
                }
                catch { }
            }
            throw this.handleError(error, 'analyzeVideo');
        }
        finally {
            if (localVideoPath && fs.existsSync(localVideoPath)) {
                try {
                    fs.unlinkSync(localVideoPath);
                }
                catch { }
            }
        }
    }
    async uploadToGemini(filePath) {
        return await this.fileManager.uploadFile(filePath, {
            mimeType: 'video/mp4',
            displayName: path.basename(filePath),
        });
    }
    async waitForProcessing(fileName) {
        let file = await this.fileManager.getFile(fileName);
        while (file.state === server_1.FileState.PROCESSING) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            file = await this.fileManager.getFile(fileName);
        }
        if (file.state === server_1.FileState.FAILED) {
            throw new Error('Video processing failed');
        }
    }
    async generateAnalysis(fileResponse, request) {
        const prompt = VersionResolver_1.VersionResolver.resolvePrompt('v1');
        let fullPrompt = prompt;
        if (request.ai_context) {
            fullPrompt += `\n\nContext:\n${request.ai_context}`;
        }
        const contentParts = [];
        if (fileResponse) {
            contentParts.push({
                fileData: { mimeType: fileResponse.mimeType, fileUri: fileResponse.uri },
            });
        }
        else if (request.youtube_url) {
            // Direct YouTube URL pass as supported by newer Gemini API
            contentParts.push({
                fileData: { mimeType: 'video/mp4', fileUri: request.youtube_url }
            });
        }
        contentParts.push({ text: fullPrompt });
        // Try primary model, fall back on 503/overload
        const FALLBACK_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];
        const modelsToTry = [this.modelName, ...FALLBACK_MODELS.filter(m => m !== this.modelName)];
        let lastError = null;
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
                    return JSON.parse(responseText);
                }
                catch (e) {
                    console.error('Failed to parse Gemini response', responseText);
                    throw new Error('Invalid JSON response from AI');
                }
            }
            catch (e) {
                lastError = e;
                const is503 = e?.message?.includes('503') || e?.message?.includes('overload') || e?.message?.includes('high demand');
                if (!is503)
                    throw e; // non-transient errors bubble immediately
            }
        }
        throw lastError ?? new Error('All Gemini models failed');
    }
    /**
     * Health check
     */
    async healthCheck() {
        return true; // Simple check since we are using Library
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
            const model = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
            const result = await model.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            throw this.handleError(error, 'generateEmbedding');
        }
    }
}
exports.AiService = AiService;
//# sourceMappingURL=AiService.js.map