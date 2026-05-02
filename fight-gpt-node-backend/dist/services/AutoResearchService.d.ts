import { ITheoryService } from './TheoryService';
import { NotificationService } from './NotificationService';
/**
 * AutoResearchService — Karpathy-style autonomous research agent.
 *
 * Runs on a schedule and:
 * 1. Scans every active game for characters with low/no theory
 * 2. Finds matchups with new scenario data since last theory generation
 * 3. Auto-generates theory where gaps exist
 * 4. Broadcasts push notifications to all users when new intel is ready
 *
 * Designed to keep the knowledge base alive without any manual triggering.
 */
export declare class AutoResearchService {
    private readonly theoryService;
    private readonly notificationService;
    private isRunning;
    constructor(theoryService: ITheoryService, notificationService: NotificationService);
    /**
     * Start the autonomous research loop.
     * Runs at 2am daily — off-peak, low-noise.
     */
    start(): void;
    /**
     * Manually trigger a full research cycle (useful from admin panel).
     */
    runResearchCycle(): Promise<{
        character: number;
        matchup: number;
        skipped: number;
    }>;
    private isStale;
    private hasNewScenarios;
    private hasNewMatchupScenarios;
    private getTopCharactersByScenarioCount;
}
//# sourceMappingURL=AutoResearchService.d.ts.map