import { AnalysisRequest, AnalysisResponse } from '../types';
import { BaseService } from './BaseService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { IGameMetadata, GameRule, GameRule as CharacterGameRule } from '../types/gameMetadata';
/**
 * AI Service interface
 */
export interface IAiService {
    analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse>;
    verifyMissionProof(videoUrl: string, missionData: {
        title: string;
        description: string;
        criteria?: any;
    }): Promise<any>;
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
export declare class AiService extends BaseService implements IAiService {
    private genAI;
    private fileManager;
    private modelName;
    private readonly gameMetadataService;
    private readonly characterEncyclopediaService;
    constructor(apiKey: string, modelName: string, gameMetadataService: IGameMetadataService, characterEncyclopediaService: ICharacterEncyclopediaService);
    /**
     * Analyze video using Gemini Native API
     */
    analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse>;
    private uploadToGemini;
    private waitForProcessing;
    private generateAnalysis;
    /**
     * Verify mission proof video
     */
    verifyMissionProof(videoUrl: string, missionData: {
        title: string;
        description: string;
        criteria?: any;
    }): Promise<any>;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get game metadata
     */
    getGameMetadata(gameId: string): Promise<IGameMetadata | null>;
    getCharacterGameRules(gameId: string, characterId: string): Promise<CharacterGameRule[] | null>;
    getGameConstants(gameId: string): Promise<Record<string, unknown> | null>;
    getGlobalMechanics(gameId: string): Promise<GameRule[] | null>;
    generateEmbedding(text: string): Promise<number[]>;
}
//# sourceMappingURL=AiService.d.ts.map