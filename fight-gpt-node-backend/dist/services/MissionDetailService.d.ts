import { ICharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { IAnalysisRepository } from '../repositories/AnalysisRepository';
export interface MissionDetails {
    missionId: string;
    title: string;
    description: string;
    type: string;
    gameId: string;
    targetCharacter?: string;
    frameData?: any[];
    recommendedMoves?: any[];
    combos?: any[];
    videoReferences?: any[];
    trainingTips: string[];
}
export declare class MissionDetailService {
    private readonly encyclopediaRepository;
    private readonly analysisRepository;
    constructor(encyclopediaRepository: ICharacterEncyclopediaRepository, analysisRepository: IAnalysisRepository);
    /**
     * Get detailed training content for a mission
     */
    getMissionDetails(missionId: string, userId: string): Promise<MissionDetails>;
    private populateAntiAirDetails;
    private findVideoReferences;
    private populateParryDetails;
    private populateComboDetails;
}
//# sourceMappingURL=MissionDetailService.d.ts.map