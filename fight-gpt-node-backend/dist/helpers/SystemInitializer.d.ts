/**
 * SystemInitializer handles automatic database setup on startup.
 * Ensures "Proactive Intelligence" data exists and Admin roles are assigned.
 */
import { RosterSyncService } from '../services/RosterSyncService';
import { IMetaService } from '../services/MetaService';
/**
 * SystemInitializer handles automatic database setup on startup.
 * Ensures "Proactive Intelligence" data exists and Admin roles are assigned.
 */
export declare class SystemInitializer {
    static run(metaService?: IMetaService, rosterSyncService?: RosterSyncService): Promise<void>;
    private static ensureAdmin;
    private static seedDeepMeta;
    private static seedDeepTheories;
    private static seedDeepScenarios;
}
//# sourceMappingURL=SystemInitializer.d.ts.map