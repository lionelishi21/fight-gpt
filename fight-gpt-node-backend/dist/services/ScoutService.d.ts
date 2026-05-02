import { BaseService } from './BaseService';
import { IIngestionService } from './IngestionService';
export interface IScoutService {
    syncProFootage(gameId: string): Promise<void>;
}
export declare class ScoutService extends BaseService implements IScoutService {
    private readonly ingestionService;
    constructor(ingestionService: IIngestionService);
    /**
     * Finds verified pro players for a game and triggers ingestion for their latest footage
     */
    syncProFootage(gameId: string): Promise<void>;
}
export default ScoutService;
//# sourceMappingURL=ScoutService.d.ts.map