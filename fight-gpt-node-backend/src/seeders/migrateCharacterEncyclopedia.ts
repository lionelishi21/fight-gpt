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

import dotenv from 'dotenv';
import { Database } from '../config/database';
import { CharacterEncyclopedia, ICharacterEncyclopediaDocument } from '../models/CharacterEncyclopedia';
import { GameRule } from '../types/characterEncyclopedia';
import { Logger } from '../helpers/logger';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

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
function convertSystemMechanicsToGameRules(
  systemMechanics: LegacySystemMechanic[]
): GameRule[] {
  return systemMechanics.map((mechanic) => {
    // Determine UI type based on mechanic properties
    let uiType = 'state';
    if (mechanic.penalty_on_block !== undefined) {
      uiType = 'penalty_state';
    } else if (mechanic.meter_cost !== undefined) {
      uiType = 'meter';
    }

    // Build value object
    const value: Record<string, unknown> = {};
    if (mechanic.penalty_on_block !== undefined) {
      value.blockstun_penalty = mechanic.penalty_on_block;
    }
    if (mechanic.meter_cost !== undefined) {
      value.cost = mechanic.meter_cost;
    }

    // Build metadata
    const metadata: Record<string, unknown> = {};
    Object.keys(mechanic).forEach((key) => {
      if (!['name', 'description', 'penalty_on_block', 'meter_cost'].includes(key)) {
        metadata[key] = mechanic[key];
      }
    });

    return {
      key: mechanic.name,
      value: Object.keys(value).length > 0 ? value : mechanic.name,
      ui_type: uiType,
      description: mechanic.description,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  });
}

/**
 * Create backup of documents before migration
 */
async function createBackup(documents: ICharacterEncyclopediaDocument[]): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `character-encyclopedia-backup-${timestamp}.json`);

  const backupData = documents.map((doc) => ({
    _id: doc._id.toString(),
    game_id: doc.game_id,
    character_id: doc.character_id,
    patch_version: doc.patch_version,
    is_current_patch: doc.is_current_patch,
    moveset: doc.moveset,
    game_rules: doc.game_rules,
    legacy_movesets: doc.legacy_movesets,
    last_updated: doc.last_updated,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    // Store original system_mechanics if it exists (for rollback)
    original_system_mechanics: (doc as any).system_mechanics,
  }));

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  Logger.info(`✅ Backup created: ${backupFile}`);
  return backupFile;
}

/**
 * Migrate CharacterEncyclopedia documents
 */
async function migrateCharacterEncyclopedia(
  dryRun: boolean = false
): Promise<{ migrated: number; skipped: number; errors: number }> {
  try {
    Logger.info('Starting Character Encyclopedia migration...');
    if (dryRun) {
      Logger.info('🔍 DRY RUN MODE - No changes will be made');
    }

    // Connect to database
    await Database.connect();
    Logger.info('Database connected');

    // Find all CharacterEncyclopedia documents
    const documents = await CharacterEncyclopedia.find({});
    Logger.info(`Found ${documents.length} CharacterEncyclopedia documents`);

    if (documents.length === 0) {
      Logger.warn('No documents found to migrate');
      await Database.disconnect();
      return { migrated: 0, skipped: 0, errors: 0 };
    }

    // Create backup
    const backupFile = await createBackup(documents);
    Logger.info(`Backup saved to: ${backupFile}`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        const docAny = doc as any;

        // Check if document has old system_mechanics field
        if (!docAny.system_mechanics || !Array.isArray(docAny.system_mechanics)) {
          Logger.warn(
            `Document ${doc._id} (${doc.game_id}/${doc.character_id}) has no system_mechanics to migrate. Skipping.`
          );
          skipped++;
          continue;
        }

        // Check if document already has game_rules
        if (doc.game_rules && doc.game_rules.length > 0) {
          Logger.warn(
            `Document ${doc._id} (${doc.game_id}/${doc.character_id}) already has game_rules. Skipping.`
          );
          skipped++;
          continue;
        }

        // Convert system_mechanics to game_rules
        const gameRules = convertSystemMechanicsToGameRules(docAny.system_mechanics);

        if (dryRun) {
          Logger.info(`[DRY RUN] Would migrate ${doc.game_id}/${doc.character_id}:`);
          Logger.info(`  - system_mechanics: ${docAny.system_mechanics.length} items`);
          Logger.info(`  - game_rules: ${gameRules.length} items`);
          migrated++;
        } else {
          // Update document
          doc.game_rules = gameRules;
          // Remove system_mechanics field
          docAny.system_mechanics = undefined;
          await doc.save();

          Logger.info(`✅ Migrated ${doc.game_id}/${doc.character_id}:`);
          Logger.info(`  - Converted ${docAny.system_mechanics.length} system_mechanics to ${gameRules.length} game_rules`);
          migrated++;
        }
      } catch (error) {
        Logger.error(`Failed to migrate document ${doc._id}:`, error);
        errors++;
      }
    }

    Logger.info(`\n✅ Migration completed!`);
    Logger.info(`   Migrated: ${migrated}`);
    Logger.info(`   Skipped: ${skipped}`);
    Logger.info(`   Errors: ${errors}`);
    if (dryRun) {
      Logger.info(`\n⚠️  This was a DRY RUN. No changes were made.`);
      Logger.info(`   Run without --dry-run to apply changes.`);
    } else {
      Logger.info(`\n💾 Backup saved to: ${backupFile}`);
    }

    // Disconnect from database
    await Database.disconnect();
    Logger.info('Database disconnected');

    return { migrated, skipped, errors };
  } catch (error) {
    Logger.error('Migration error:', error);
    await Database.disconnect();
    throw error;
  }
}

/**
 * Rollback migration using backup file
 */
async function rollbackMigration(backupFile: string): Promise<void> {
  try {
    Logger.info(`Starting rollback from backup: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // Connect to database
    await Database.connect();
    Logger.info('Database connected');

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
    Logger.info(`Found ${backupData.length} documents in backup`);

    let restored = 0;
    let errors = 0;

    for (const backupDoc of backupData) {
      try {
        const doc = await CharacterEncyclopedia.findById(backupDoc._id);

        if (!doc) {
          Logger.warn(`Document ${backupDoc._id} not found. Skipping.`);
          continue;
        }

        // Restore game_rules from backup
        doc.game_rules = backupDoc.game_rules || [];

        // Restore system_mechanics if it existed
        if (backupDoc.original_system_mechanics) {
          (doc as any).system_mechanics = backupDoc.original_system_mechanics;
        }

        await doc.save();
        Logger.info(`✅ Restored ${backupDoc.game_id}/${backupDoc.character_id}`);
        restored++;
      } catch (error) {
        Logger.error(`Failed to restore document ${backupDoc._id}:`, error);
        errors++;
      }
    }

    Logger.info(`\n✅ Rollback completed!`);
    Logger.info(`   Restored: ${restored}`);
    Logger.info(`   Errors: ${errors}`);

    // Disconnect from database
    await Database.disconnect();
    Logger.info('Database disconnected');
  } catch (error) {
    Logger.error('Rollback error:', error);
    await Database.disconnect();
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  if (command === 'rollback' && args[1]) {
    rollbackMigration(args[1])
      .then(() => {
        Logger.info('Rollback finished');
        process.exit(0);
      })
      .catch((error) => {
        Logger.error('Rollback error:', error);
        process.exit(1);
      });
  } else if (command === 'migrate' || !command) {
    migrateCharacterEncyclopedia(dryRun)
      .then(() => {
        Logger.info('Migration finished');
        process.exit(0);
      })
      .catch((error) => {
        Logger.error('Migration error:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  npm run migrate:character-encyclopedia [--dry-run]  - Run migration');
    console.log('  npm run migrate:character-encyclopedia rollback <backup-file>  - Rollback migration');
    process.exit(1);
  }
}

export { migrateCharacterEncyclopedia, rollbackMigration, convertSystemMechanicsToGameRules };
