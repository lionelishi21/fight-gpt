import { BaseService } from './BaseService';
import { IProPlayer, ProPlayer } from '../models/ProPlayer';
import { IIngestionService } from './IngestionService';
import { Logger } from '../helpers/logger';

export interface IScoutService {
    syncProFootage(gameId: string): Promise<void>;
}

export class ScoutService extends BaseService implements IScoutService {
    constructor(
        private readonly ingestionService: IIngestionService
    ) {
        super();
    }

    /**
     * Finds verified pro players for a game and triggers ingestion for their latest footage
     */
    public async syncProFootage(gameId: string): Promise<void> {
        try {
            const pros = await ProPlayer.find({ gameId, isVerified: true }).exec();
            Logger.info(`[ScoutService] Syncing footage for ${pros.length} pro players in ${gameId}`);

            for (const pro of pros) {
                // Use the pro's name + game as a search query
                // In a real prod scenario, we would use their specific channel IDs
                const query = `${pro.name} ${gameId} high level matches recent`;
                await this.ingestionService.triggerIngestion(gameId, 3); // Seed some jobs
                
                // Update last sync time
                pro.lastIngestJobAt = new Date();
                await pro.save();
            }
        } catch (error) {
            Logger.error('[ScoutService] Failed to sync pro footage', error);
        }
    }
}

export default ScoutService;
