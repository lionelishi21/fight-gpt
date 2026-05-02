"use strict";
/**
 * Game Metadata Seeder
 * Seeds the database with game metadata for SF6, Tekken 8, and UMVC3
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedGameMetadata = seedGameMetadata;
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const GameMetadata_1 = require("../models/GameMetadata");
const logger_1 = require("../helpers/logger");
// Load environment variables
dotenv_1.default.config();
/**
 * Street Fighter 6 Game Metadata
 */
const SF6_METADATA = {
    game_id: 'sf6',
    patch_version: '1.05',
    is_current: true,
    constants: {
        team_size: 1,
        has_air_dash: false,
        has_3d_movement: false,
        has_assists: false,
        has_dhc: false,
        has_team_supers: false,
        max_meter: 6,
    },
    global_mechanics: [
        {
            key: 'Drive Gauge',
            value: 6,
            ui_type: 'meter',
            description: 'System gauge used for Drive Rush, Drive Parry, Drive Impact, and Drive Reversal',
            metadata: {
                max_value: 6,
                recharge_rate: 'slow',
            },
        },
        {
            key: 'Drive Impact',
            value: {
                armor: true,
                guard_crush: true,
                wall_splat: true,
            },
            ui_type: 'special_move',
            description: 'Armored attack that can absorb hits and guard crush on block',
            metadata: {
                cost: 1,
                startup: 26,
            },
        },
        {
            key: 'Drive Rush',
            value: {
                forward_momentum: true,
                cancelable: true,
            },
            ui_type: 'movement',
            description: 'Burst forward movement that can cancel normals and extend combos',
            metadata: {
                cost: 1,
                cancel_window: 'special',
            },
        },
        {
            key: 'Drive Parry',
            value: {
                perfect_parry: true,
                chip_damage: false,
            },
            ui_type: 'defensive',
            description: 'Parry that can block all attacks and perfect parry for frame advantage',
            metadata: {
                cost: 0.5,
                perfect_window: 4,
            },
        },
        {
            key: 'Burnout',
            value: {
                blockstun_penalty: 4,
                no_drive_actions: true,
            },
            ui_type: 'penalty_state',
            description: 'Penalty state when Drive Gauge is depleted, adds +4 blockstun',
            metadata: {
                duration: 'until_gauge_refills',
            },
        },
    ],
};
/**
 * Tekken 8 Game Metadata
 */
const TEKKEN8_METADATA = {
    game_id: 'tekken8',
    patch_version: '1.01',
    is_current: true,
    constants: {
        team_size: 1,
        has_air_dash: false,
        has_3d_movement: true,
        has_assists: false,
        has_dhc: false,
        has_team_supers: false,
        max_meter: 2,
    },
    global_mechanics: [
        {
            key: 'Heat System',
            value: {
                duration: 15,
                chip_damage: true,
                enhanced_moves: true,
            },
            ui_type: 'timed_buff',
            description: 'Aggressive state that lasts 15 seconds, enables chip damage and enhanced moves',
            metadata: {
                activation_cost: 1,
                max_duration: 15,
            },
        },
        {
            key: 'Heat Burst',
            value: {
                armor: true,
                plus_on_block: true,
            },
            ui_type: 'special_move',
            description: 'Armored attack that is plus on block and leads to Heat State',
            metadata: {
                startup: 16,
                plus_frames: 3,
            },
        },
        {
            key: 'Heat Engager',
            value: {
                activates_heat: true,
                combo_starter: true,
            },
            ui_type: 'combo_starter',
            description: 'Moves that activate Heat State and start combos',
            metadata: {
                damage_bonus: 1.2,
            },
        },
        {
            key: 'Sidestep',
            value: {
                axis: 'Z-axis',
                invincibility: 'partial',
            },
            ui_type: 'movement',
            description: 'Lateral movement to evade linear attacks in 3D space',
            metadata: {
                frames: 8,
                recovery: 12,
            },
        },
        {
            key: 'Wall Carry',
            value: {
                wall_splat: true,
                okizeme: true,
            },
            ui_type: 'combo_mechanic',
            description: 'Ability to carry opponents to the wall for wall combos and okizeme',
            metadata: {
                wall_damage_bonus: 1.3,
            },
        },
    ],
};
/**
 * Ultimate Marvel vs Capcom 3 Game Metadata
 */
const UMVC3_METADATA = {
    game_id: 'umvc3',
    patch_version: '1.06',
    is_current: true,
    constants: {
        team_size: 3,
        has_air_dash: true,
        has_3d_movement: false,
        has_assists: true,
        has_dhc: true,
        has_team_supers: true,
        max_meter: 5,
    },
    global_mechanics: [
        {
            key: 'X-Factor',
            value: {
                level_1: { multiplier: 1.2, duration: 10 },
                level_2: { multiplier: 1.3, duration: 12 },
                level_3: { multiplier: 1.5, duration: 15 },
            },
            ui_type: 'comeback_mechanic',
            description: 'Comeback mechanic with damage multiplier and speed boost, stronger when fewer characters remain',
            metadata: {
                activation: 'automatic_on_character_death',
                health_regen: true,
            },
        },
        {
            key: 'Team Synergy',
            value: {
                combo_damage_bonus: 1.2,
                assist_cooldown: 10,
            },
            ui_type: 'team_bonus',
            description: 'Team composition affects combo damage and assist availability',
            metadata: {
                optimal_order: 'point_anchor_middle',
            },
        },
        {
            key: 'Happy Birthday',
            value: {
                double_hit: true,
                damage_multiplier: 1.5,
            },
            ui_type: 'unique_event',
            description: 'Hitting multiple characters at once, a unique Marvel mechanic',
            metadata: {
                meter_gain: 'double',
            },
        },
        {
            key: 'Air Dash',
            value: {
                forward: true,
                backward: true,
                cancelable: true,
            },
            ui_type: 'movement',
            description: 'Air mobility for mix-ups, escapes, and combo extensions',
            metadata: {
                frames: 4,
                recovery: 8,
            },
        },
        {
            key: 'DHC (Delayed Hyper Combo)',
            value: {
                super_chaining: true,
                damage_optimization: true,
            },
            ui_type: 'combo_mechanic',
            description: 'Chaining super moves between characters for maximum damage',
            metadata: {
                meter_cost: 'variable',
                damage_bonus: 1.3,
            },
        },
        {
            key: 'Team Supers',
            value: {
                multi_character: true,
                high_damage: true,
            },
            ui_type: 'super_move',
            description: 'Super moves that involve multiple team members',
            metadata: {
                meter_cost: 3,
                damage: 'extreme',
            },
        },
        {
            key: 'Assist Calls',
            value: {
                alpha: 'neutral',
                beta: 'pressure',
                gamma: 'combo_extension',
            },
            ui_type: 'team_mechanic',
            description: 'Three assist types for different situations (neutral, pressure, combo)',
            metadata: {
                cooldown: 10,
                invincibility: 'startup',
            },
        },
    ],
};
/**
 * Main seeder function
 */
async function seedGameMetadata() {
    try {
        logger_1.Logger.info('Starting Game Metadata seeder...');
        // Connect to database
        await database_1.Database.connect();
        logger_1.Logger.info('Database connected');
        const gameMetadataList = [
            { name: 'Street Fighter 6', data: SF6_METADATA },
            { name: 'Tekken 8', data: TEKKEN8_METADATA },
            { name: 'Ultimate Marvel vs Capcom 3', data: UMVC3_METADATA },
        ];
        let createdCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        for (const { name, data } of gameMetadataList) {
            try {
                // Check if metadata already exists
                const existing = await GameMetadata_1.GameMetadata.findOne({ game_id: data.game_id });
                if (existing) {
                    // Update existing metadata if it's not current or version is different
                    if (!existing.is_current || existing.patch_version !== data.patch_version) {
                        existing.global_mechanics = data.global_mechanics;
                        existing.constants = data.constants;
                        existing.patch_version = data.patch_version;
                        existing.is_current = data.is_current;
                        await existing.save();
                        logger_1.Logger.info(`✅ Updated game metadata: ${name} (${data.game_id})`);
                        updatedCount++;
                    }
                    else {
                        logger_1.Logger.warn(`Game metadata for ${name} (${data.game_id}) already exists and is current. Skipping.`);
                        skippedCount++;
                    }
                }
                else {
                    // Create new metadata
                    const gameMetadata = new GameMetadata_1.GameMetadata(data);
                    await gameMetadata.save();
                    logger_1.Logger.info(`✅ Created game metadata: ${name} (${data.game_id})`);
                    createdCount++;
                }
            }
            catch (error) {
                logger_1.Logger.error(`Failed to seed game metadata for ${name}:`, error);
                throw error;
            }
        }
        logger_1.Logger.info(`\n✅ Game Metadata seeder completed successfully!`);
        logger_1.Logger.info(`   Created: ${createdCount}`);
        logger_1.Logger.info(`   Updated: ${updatedCount}`);
        logger_1.Logger.info(`   Skipped: ${skippedCount}`);
        // Disconnect from database
        await database_1.Database.disconnect();
        logger_1.Logger.info('Database disconnected');
    }
    catch (error) {
        logger_1.Logger.error('Game Metadata seeder error:', error);
        await database_1.Database.disconnect();
        process.exit(1);
    }
}
// Run seeder if this file is executed directly
if (require.main === module) {
    seedGameMetadata()
        .then(() => {
        logger_1.Logger.info('Seeder finished');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.Logger.error('Seeder error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seedGameMetadata.js.map