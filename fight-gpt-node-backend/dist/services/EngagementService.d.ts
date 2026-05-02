import { BaseService } from './BaseService';
import { IEngagement, EngagementTargetType } from '../models/Engagement';
import { ITheoryService } from './TheoryService';
import { ApiResponse } from '../types';
export declare class EngagementService extends BaseService {
    private readonly theoryService;
    constructor(theoryService: ITheoryService);
    /**
     * Submit a rating and optional comment for a target entity
     */
    submitEngagement(userId: string, targetId: string, targetType: EngagementTargetType, rating: number, comment?: string): Promise<ApiResponse<IEngagement>>;
    /**
     * Get engagement stats and comments for a target
     */
    getTargetEngagement(targetId: string): Promise<ApiResponse<{
        averageRating: number;
        totalRatings: number;
        comments: Array<{
            username: string;
            comment: string;
            rating: number;
            date: Date;
        }>;
    }>>;
    /**
     * Logic to trigger AI re-generation if feedback is consistently negative
     */
    private checkAndTriggerAiReview;
}
//# sourceMappingURL=EngagementService.d.ts.map