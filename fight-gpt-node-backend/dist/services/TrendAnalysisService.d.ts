import { IAnalysisRepository } from '../repositories/AnalysisRepository';
import { NotificationService } from './NotificationService';
import { IGameMetadataService } from './GameMetadataService';
/**
 * Service responsible for analyzing trends in discovery data
 * and generating intelligence alerts (Meta Shifts).
 */
export interface ITrendAnalysisService {
    analyzeMetaShifts(): Promise<void>;
}
export declare class TrendAnalysisService implements ITrendAnalysisService {
    private readonly analysisRepository;
    private readonly notificationService;
    private readonly gameMetadataService;
    constructor(analysisRepository: IAnalysisRepository, notificationService: NotificationService, gameMetadataService: IGameMetadataService);
    /**
     * Run nightly meta-shift analysis
     */
    analyzeMetaShifts(): Promise<void>;
}
//# sourceMappingURL=TrendAnalysisService.d.ts.map