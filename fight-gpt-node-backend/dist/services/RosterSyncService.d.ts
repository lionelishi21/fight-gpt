import { ScraperService } from './ScraperService';
export declare class RosterSyncService {
    private readonly scraperService;
    constructor(scraperService: ScraperService);
    /**
     * Sync the roster for a game:
     * 1. Fetches latest characters from ScraperService
     * 2. Updates Character collection (adds missing, updates status)
     * 3. Optionally syncs frame data for all released characters
     */
    syncRoster(gameId: string, fullSync?: boolean): Promise<{
        added: number;
        updated: number;
        frameDataSynced: number;
        errors: string[];
    }>;
    /**
     * Scrape and update frame data for a single character
     */
    private syncCharacterFrameData;
}
//# sourceMappingURL=RosterSyncService.d.ts.map