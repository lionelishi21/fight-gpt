import { AnalysisRequest, AnalysisResponse, ApiResponse } from '../types';
import { IAnalysisRepository } from '../repositories/AnalysisRepository';
import { IAiService } from './AiService';
import { IGameMetadataService } from './GameMetadataService';
import { ICharacterEncyclopediaService } from './CharacterEncyclopediaService';
import { ICharacterService } from './CharacterService';
import { BaseService } from './BaseService';
import { IVectorRepository } from '../repositories/VectorRepository';
import { IRivalRepository } from '../repositories/RivalRepository';
import { NotificationService } from './NotificationService';
export interface IAnalysisService {
    analyzeVideo(request: AnalysisRequest, userId?: string): Promise<ApiResponse<AnalysisResponse>>;
    getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResponse>>;
    getRecentAnalyses(limit: number, userId?: string, gameId?: string): Promise<ApiResponse<any[]>>;
    getDiscoveryAnalyses(limit?: number): Promise<ApiResponse<any[]>>;
}
/**
 * Analysis Service implementation
 */
export declare class AnalysisService extends BaseService implements IAnalysisService {
    private readonly analysisRepository;
    private readonly aiService;
    private readonly gameMetadataService;
    private readonly characterEncyclopediaService;
    private readonly characterService?;
    private readonly vectorRepository?;
    private readonly notificationService?;
    private readonly rivalRepository?;
    constructor(analysisRepository: IAnalysisRepository, aiService: IAiService, gameMetadataService: IGameMetadataService, characterEncyclopediaService: ICharacterEncyclopediaService, characterService?: ICharacterService, vectorRepository?: IVectorRepository, notificationService?: NotificationService, rivalRepository?: IRivalRepository);
    private sanitizeAiString;
    analyzeVideo(request: AnalysisRequest, userId?: string): Promise<ApiResponse<AnalysisResponse>>;
    getAnalysis(analysisId: string): Promise<ApiResponse<any>>;
    getRecentAnalyses(limit?: number, userId?: string, gameId?: string): Promise<ApiResponse<any[]>>;
    getDiscoveryAnalyses(limit?: number, gameId?: string): Promise<ApiResponse<any[]>>;
    private getCachedAnalysis;
    private validateAnalysisRequest;
    private enrichRequestWithGameContext;
    /**
     * Processes the timeline events from an analysis and stores them in the vector database
     * if they are novel, or links them to existing scenarios if they are similar.
     */
    processVectorIntelligence(analysisId: string, request: AnalysisRequest, analysisResponse: AnalysisResponse): Promise<void>;
}
//# sourceMappingURL=AnalysisService.d.ts.map