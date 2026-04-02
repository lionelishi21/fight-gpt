import { BaseService } from './BaseService';
import { IAnalyticsRepository, AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { Logger } from '../helpers/logger';

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

export class AnalyticsService extends BaseService implements IAnalyticsService {
    private repository: IAnalyticsRepository;

    constructor(repository?: IAnalyticsRepository) {
        super();
        this.repository = repository || new AnalyticsRepository();
    }

    /**
     * Fire-and-forget event recording
     */
    public async recordEvent(request: RecordEventRequest): Promise<void> {
        try {
            if (!request.event_type || !request.game_id) {
                Logger.warn(`[AnalyticsService] Missing required fields for event: ${JSON.stringify(request)}`);
                return;
            }
            await this.repository.createEvent(request as any);
        } catch (error) {
            // We don't want analytics tracking to fail the main request
            Logger.error(`[AnalyticsService] Failed to record event: ${(error as Error).message}`);
        }
    }

    public async getEventCountsByType(limit: number = 10): Promise<any[]> {
        return this.repository.getEventCountsByType(limit);
    }

    public async getMostQueriedRules(gameId?: string, limit: number = 10): Promise<any[]> {
        return this.repository.getMostQueriedRules(gameId, limit);
    }

    public async getMostQueriedCharacters(gameId?: string, limit: number = 10): Promise<any[]> {
        return this.repository.getMostQueriedCharacters(gameId, limit);
    }
}

export default AnalyticsService;
