import { BaseService } from './BaseService';
import { ITheoryRepository } from '../repositories/TheoryRepository';
import { IVectorRepository } from '../repositories/VectorRepository';
import { ITheoryDocument } from '../models/TheoryDocument';
import { ApiResponse } from '../types';
import { NotificationService } from './NotificationService';
export type SkillLevel = 'Rookie' | 'Intermediate' | 'Pro';
export interface ITheoryService {
    generateCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel, correctionFeedback?: string): Promise<ApiResponse<ITheoryDocument>>;
    generateMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel, correctionFeedback?: string): Promise<ApiResponse<ITheoryDocument>>;
    getCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>>;
    getMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>>;
    getAllCharacterTheories(gameId: string): Promise<ApiResponse<ITheoryDocument[]>>;
}
export declare class TheoryService extends BaseService implements ITheoryService {
    private readonly theoryRepository;
    private readonly vectorRepository;
    private readonly geminiApiKey;
    private readonly notificationService?;
    private genAI;
    constructor(theoryRepository: ITheoryRepository, vectorRepository: IVectorRepository, geminiApiKey: string, notificationService?: NotificationService);
    /**
     * Generate or refresh character theory from vector DB scenarios
     */
    generateCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel, correctionFeedback?: string): Promise<ApiResponse<ITheoryDocument>>;
    /**
     * Generate or refresh matchup theory from vector DB scenarios
     */
    generateMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel, correctionFeedback?: string): Promise<ApiResponse<ITheoryDocument>>;
    getCharacterTheory(gameId: string, characterId: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>>;
    getMatchupTheory(gameId: string, charA: string, charB: string, targetSkillLevel?: SkillLevel): Promise<ApiResponse<ITheoryDocument>>;
    getAllCharacterTheories(gameId: string): Promise<ApiResponse<ITheoryDocument[]>>;
    private getCurrentPatchVersion;
    private getScenariosForCharacter;
    private getScenariosForMatchup;
    private calcConfidence;
    private synthesiseCharacterTheory;
    private synthesiseMatchupTheory;
}
//# sourceMappingURL=TheoryService.d.ts.map