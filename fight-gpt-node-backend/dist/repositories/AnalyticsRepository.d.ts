import { BaseRepository } from './BaseRepository';
import { IAnalyticsEventDocument } from '../models/AnalyticsEvent';
export interface IAnalyticsRepository {
    createEvent(data: Partial<IAnalyticsEventDocument>): Promise<IAnalyticsEventDocument>;
    getEventCountsByType(limit?: number): Promise<any[]>;
    getMostQueriedRules(gameId?: string, limit?: number): Promise<any[]>;
    getMostQueriedCharacters(gameId?: string, limit?: number): Promise<any[]>;
}
export declare class AnalyticsRepository extends BaseRepository<IAnalyticsEventDocument> implements IAnalyticsRepository {
    constructor();
    createEvent(data: Partial<IAnalyticsEventDocument>): Promise<IAnalyticsEventDocument>;
    getEventCountsByType(limit?: number): Promise<any[]>;
    getMostQueriedRules(gameId?: string, limit?: number): Promise<any[]>;
    getMostQueriedCharacters(gameId?: string, limit?: number): Promise<any[]>;
}
export default AnalyticsRepository;
//# sourceMappingURL=AnalyticsRepository.d.ts.map