import { BaseService } from './BaseService';
import { IAnalyticsRepository } from '../repositories/AnalyticsRepository';
export interface RecordEventRequest {
    event_type: 'game_metadata_query' | 'character_encyclopedia_query' | 'game_rule_query' | 'analyze_video';
    game_id: string;
    character_id?: string;
    rule_key?: string;
    user_id?: string;
    metadata?: Record<string, any>;
}
export interface IAnalyticsService {
    recordEvent(request: RecordEventRequest): Promise<void>;
    getEventCountsByType(limit?: number): Promise<any[]>;
    getMostQueriedRules(gameId?: string, limit?: number): Promise<any[]>;
    getMostQueriedCharacters(gameId?: string, limit?: number): Promise<any[]>;
}
export declare class AnalyticsService extends BaseService implements IAnalyticsService {
    private repository;
    constructor(repository?: IAnalyticsRepository);
    /**
     * Fire-and-forget event recording
     */
    recordEvent(request: RecordEventRequest): Promise<void>;
    getEventCountsByType(limit?: number): Promise<any[]>;
    getMostQueriedRules(gameId?: string, limit?: number): Promise<any[]>;
    getMostQueriedCharacters(gameId?: string, limit?: number): Promise<any[]>;
}
export default AnalyticsService;
//# sourceMappingURL=AnalyticsService.d.ts.map