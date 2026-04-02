import { BaseRepository } from './BaseRepository';
import { AnalyticsEvent, IAnalyticsEventDocument } from '../models/AnalyticsEvent';

export interface IAnalyticsRepository {
    createEvent(data: Partial<IAnalyticsEventDocument>): Promise<IAnalyticsEventDocument>;
    getEventCountsByType(limit?: number): Promise<any[]>;
    getMostQueriedRules(gameId?: string, limit?: number): Promise<any[]>;
    getMostQueriedCharacters(gameId?: string, limit?: number): Promise<any[]>;
}

export class AnalyticsRepository extends BaseRepository<IAnalyticsEventDocument> implements IAnalyticsRepository {
    constructor() {
        super(AnalyticsEvent);
    }

    public async createEvent(data: Partial<IAnalyticsEventDocument>): Promise<IAnalyticsEventDocument> {
        return this.model.create(data);
    }

    public async getEventCountsByType(limit: number = 10): Promise<any[]> {
        return this.model.aggregate([
            { $group: { _id: '$event_type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }

    public async getMostQueriedRules(gameId?: string, limit: number = 10): Promise<any[]> {
        const matchStage: any = { event_type: 'game_rule_query', rule_key: { $exists: true, $ne: null } };
        if (gameId) matchStage.game_id = gameId;

        return this.model.aggregate([
            { $match: matchStage },
            { $group: { _id: '$rule_key', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }

    public async getMostQueriedCharacters(gameId?: string, limit: number = 10): Promise<any[]> {
        const matchStage: any = { event_type: 'character_encyclopedia_query', character_id: { $exists: true, $ne: null } };
        if (gameId) matchStage.game_id = gameId;

        return this.model.aggregate([
            { $match: matchStage },
            { $group: { _id: '$character_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).exec();
    }
}

export default AnalyticsRepository;
