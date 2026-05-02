/**
 * Character Encyclopedia Migration Script
 * Migrates CharacterEncyclopedia documents from old format (system_mechanics) to new format (game_rules)
 *
 * This script handles:
 * - Converting system_mechanics array to game_rules array
 * - Data validation
 * - Backup creation
 * - Rollback capability
 */
import { GameRule } from '../types/characterEncyclopedia';
/**
 * Legacy system_mechanics interface (old format)
 */
interface LegacySystemMechanic {
    name: string;
    description?: string;
    penalty_on_block?: number;
    meter_cost?: number;
    [key: string]: unknown;
}
/**
 * Convert legacy system_mechanics to game_rules format
 */
declare function convertSystemMechanicsToGameRules(systemMechanics: LegacySystemMechanic[]): GameRule[];
/**
 * Migrate CharacterEncyclopedia documents
 */
declare function migrateCharacterEncyclopedia(dryRun?: boolean): Promise<{
    migrated: number;
    skipped: number;
    errors: number;
}>;
/**
 * Rollback migration using backup file
 */
declare function rollbackMigration(backupFile: string): Promise<void>;
export { migrateCharacterEncyclopedia, rollbackMigration, convertSystemMechanicsToGameRules };
//# sourceMappingURL=migrateCharacterEncyclopedia.d.ts.map