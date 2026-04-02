/**
 * Character Encyclopedia Seeder
 * Converts existing SF6 character data to CharacterEncyclopedia format
 * Seeds the database with comprehensive movesets and game rules
 */

import dotenv from 'dotenv';
import { Database } from '../config/database';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { CreateCharacterEncyclopediaRequest, Move, GameRule } from '../types/characterEncyclopedia';
import { Logger } from '../helpers/logger';

// Load environment variables
dotenv.config();

/**
 * Helper function to convert Character move to CharacterEncyclopedia Move format
 */
export function convertMoveToEncyclopediaFormat(
  move: {
    id: string;
    name: string;
    startup: number;
    active: number;
    recovery: number;
    on_block: number;
    on_hit?: number;
    on_counter_hit?: number;
    damage?: number;
    stun?: number;
    tags?: string[];
    notes?: string;
  },
  characterName: string
): Move {
  // Determine category based on tags
  let category: Move['category'] = 'special';
  if (move.tags?.includes('super')) {
    category = 'super';
  } else if (move.tags?.includes('ex')) {
    category = 'ex';
  } else if (move.tags?.includes('normal')) {
    category = 'normal';
  }

  // Generate input notation (simplified - would need actual input data)
  const input = generateInputNotation(move.name, characterName, category);

  // Generate how_to_perform description
  const howToPerform = generateHowToPerform(move.name, characterName, category);

  // Extract properties from tags
  const properties: string[] = [];
  if (move.tags?.includes('projectile')) properties.push('Projectile');
  if (move.tags?.includes('anti_air')) properties.push('Anti-Air');
  if (move.tags?.includes('armor')) properties.push('Armor');
  if (move.tags?.includes('invincible')) properties.push('Invincible');
  if (move.tags?.includes('cancelable')) properties.push('Cancelable');

  return {
    name: move.name,
    input,
    how_to_perform: howToPerform,
    category,
    properties,
    frame_data: {
      startup: move.startup,
      active: move.active,
      recovery: move.recovery,
      on_block: move.on_block,
      on_hit: move.on_hit,
      damage: move.damage,
    },
  };
}

/**
 * Generate input notation for a move (simplified - would need actual input data)
 */
export function generateInputNotation(moveName: string, characterName: string, category: Move['category']): string {
  // Common SF6 inputs (simplified mapping)
  const inputMap: Record<string, string> = {
    'Hadoken': '236P',
    'Shoryuken': '623P',
    'Tatsumaki Senpukyaku': '214K',
    'Denjin Hadoken': '236236P',
    'Sand Blast': '236P',
    'Rising Uppercut': '623P',
    'Flash Knuckle': '236K',
    'Luminous Drive': '236236P',
    'Bakkai': '214P',
    'Sobat': '236K',
    'Target Combo': '5MP > 5HP',
    'Sonic Boom': '236P',
    'Flash Kick': '623K',
    'Sonic Hurricane': '236236K',
    'Spinning Bird Kick': '214K',
    'Hazanshu': '214K',
    'Kikosho': '236236P',
    'Somersault Kick': '623K',
    'Sonic Blade': '236P',
    'Sonic Cross': '236236P',
    'Spinning Piledriver': '360P',
    'Flying Power Bomb': '360K',
    'Final Atomic Buster': '236236P',
    'Sumo Headbutt': '236P',
    'Sumo Smash': '214P',
    'Oicho Throw': '360P',
    'The Mountain': '236236P',
    'Cannon Strike': '236K',
    'Spiral Arrow': '214K',
    'Hooligan Combination': '236236K',
    'Somersault Strike': '623K',
    'Machine Gun Upper': '236P',
    'Machine Gun Straight': '236236P',
    'Manège Doré': '236236P',
    'Gladius': '236P',
    'Quadriga': '236236P',
    'Condor Spire': '236P',
    'Tomahawk Buster': '236236P',
    'Amnesia': '236236P',
  };

  // Try to find exact match
  if (inputMap[moveName]) {
    return inputMap[moveName];
  }

  // Try partial match
  for (const [key, value] of Object.entries(inputMap)) {
    if (moveName.includes(key)) {
      return value;
    }
  }

  // Default based on category
  if (category === 'super') {
    return '236236P';
  } else if (category === 'ex') {
    return '236PP';
  } else if (category === 'special') {
    return '236P';
  } else {
    return '5P';
  }
}

/**
 * Generate how_to_perform description
 */
export function generateHowToPerform(moveName: string, characterName: string, category: Move['category']): string {
  const input = generateInputNotation(moveName, characterName, category);

  // Convert input notation to description
  const descriptions: Record<string, string> = {
    '236P': 'Quarter Circle Forward + Punch',
    '236K': 'Quarter Circle Forward + Kick',
    '623P': 'Forward, Down, Down-Forward + Punch',
    '623K': 'Forward, Down, Down-Forward + Kick',
    '214P': 'Quarter Circle Back + Punch',
    '214K': 'Quarter Circle Back + Kick',
    '236236P': 'Two Quarter Circles Forward + Punch',
    '236236K': 'Two Quarter Circles Forward + Kick',
    '360P': 'Full Circle + Punch',
    '360K': 'Full Circle + Kick',
    '5MP': 'Medium Punch',
    '5HP': 'Heavy Punch',
    '5MK': 'Medium Kick',
    '5HK': 'Heavy Kick',
    '236PP': 'Quarter Circle Forward + Two Punches',
    '214PP': 'Quarter Circle Back + Two Punches',
  };

  if (descriptions[input]) {
    return descriptions[input];
  }

  // Fallback
  if (category === 'super') {
    return 'Super Art input';
  } else if (category === 'ex') {
    return 'EX Special Move input';
  } else if (category === 'special') {
    return 'Special Move input';
  } else {
    return 'Normal attack';
  }
}

/**
 * Get game rules for SF6 characters
 */
export function getSF6GameRules(characterName: string): GameRule[] {
  const baseRules: GameRule[] = [
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
  ];

  // Character-specific rules
  const characterRules: Record<string, GameRule[]> = {
    Ryu: [
      {
        key: 'Denjin Charge',
        value: true,
        ui_type: 'state',
        description: 'Ryu can charge Denjin Hadoken for more damage',
        metadata: {
          charge_time: 60,
        },
      },
    ],
    Jamie: [
      {
        key: 'Drink Levels',
        value: 4,
        ui_type: 'stack',
        description: 'Jamie gains drink levels that enhance his moves',
        metadata: {
          max_levels: 4,
          per_drink: 1,
        },
      },
    ],
    Manon: [
      {
        key: 'Medal System',
        value: 5,
        ui_type: 'stack',
        description: 'Manon gains medals from successful throws that increase throw damage',
        metadata: {
          max_medals: 5,
        },
      },
    ],
  };

  return [...baseRules, ...(characterRules[characterName] || [])];
}

/**
 * Convert Character to CharacterEncyclopedia format
 */
export async function convertCharacterToEncyclopedia(character: any): Promise<CreateCharacterEncyclopediaRequest | null> {
  try {
    const moves = character.moves || [];
    const characterName = character.name;

    // Organize moves by category
    const normals: Move[] = [];
    const specials: Move[] = [];
    const exMoves: Move[] = [];
    const supers: Move[] = [];

    for (const move of moves) {
      const convertedMove = convertMoveToEncyclopediaFormat(move, characterName);

      // Categorize move
      if (convertedMove.category === 'normal') {
        normals.push(convertedMove);
      } else if (convertedMove.category === 'ex') {
        exMoves.push(convertedMove);
      } else if (convertedMove.category === 'super') {
        supers.push(convertedMove);
      } else {
        specials.push(convertedMove);
      }
    }

    // Get game rules
    const gameRules = getSF6GameRules(characterName);

    return {
      game_id: character.game_id,
      character_id: character.name.toLowerCase().replace(/\s+/g, '_'),
      patch_version: character.version || '1.05',
      is_current_patch: character.is_current !== false,
      moveset: {
        normals,
        specials,
        ex_moves: exMoves,
        supers,
      },
      game_rules: gameRules,
    };
  } catch (error) {
    Logger.error(`Failed to convert character ${character.name}:`, error);
    return null;
  }
}

/**
 * Main seeder function
 */
async function seedCharacterEncyclopedia(): Promise<void> {
  try {
    Logger.info('Starting Character Encyclopedia seeder...');

    // Connect to database
    await Database.connect();
    Logger.info('Database connected');

    // Fetch all SF6 characters
    const characters = await Character.find({ game_id: 'sf6', is_current: true });
    Logger.info(`Found ${characters.length} SF6 characters to convert`);

    if (characters.length === 0) {
      Logger.warn('No SF6 characters found. Please run seed:sf6 first.');
      await Database.disconnect();
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const character of characters) {
      try {
        const characterId = character.name.toLowerCase().replace(/\s+/g, '_');

        // Check if encyclopedia already exists
        const existing = await CharacterEncyclopedia.findOne({
          game_id: 'sf6',
          character_id: characterId,
          is_current_patch: true,
        });

        // Convert character to encyclopedia format
        const encyclopediaData = await convertCharacterToEncyclopedia(character);

        if (!encyclopediaData) {
          Logger.error(`Failed to convert character: ${character.name}`);
          errorCount++;
          continue;
        }

        if (existing) {
          // Update if version is different
          if (existing.patch_version !== encyclopediaData.patch_version) {
            existing.moveset = encyclopediaData.moveset;
            existing.game_rules = encyclopediaData.game_rules;
            existing.patch_version = encyclopediaData.patch_version;
            existing.is_current_patch = encyclopediaData.is_current_patch;
            existing.last_updated = new Date();
            await existing.save();
            Logger.info(`✅ Updated Character Encyclopedia: ${character.name} (${characterId})`);
            updatedCount++;
          } else {
            Logger.warn(`Character Encyclopedia for ${character.name} (${characterId}) already exists and is current. Skipping.`);
            skippedCount++;
          }
        } else {
          // Create new encyclopedia
          const encyclopedia = new CharacterEncyclopedia(encyclopediaData);
          await encyclopedia.save();
          Logger.info(`✅ Created Character Encyclopedia: ${character.name} (${characterId})`);
          Logger.info(`   - Normals: ${encyclopediaData.moveset.normals.length}`);
          Logger.info(`   - Specials: ${encyclopediaData.moveset.specials.length}`);
          Logger.info(`   - EX Moves: ${encyclopediaData.moveset.ex_moves.length}`);
          Logger.info(`   - Supers: ${encyclopediaData.moveset.supers.length}`);
          Logger.info(`   - Game Rules: ${encyclopediaData.game_rules.length}`);
          createdCount++;
        }
      } catch (error) {
        Logger.error(`Failed to seed Character Encyclopedia for ${character.name}:`, error);
        errorCount++;
      }
    }

    Logger.info(`\n✅ Character Encyclopedia seeder completed!`);
    Logger.info(`   Created: ${createdCount}`);
    Logger.info(`   Updated: ${updatedCount}`);
    Logger.info(`   Skipped: ${skippedCount}`);
    Logger.info(`   Errors: ${errorCount}`);

    // Disconnect from database
    await Database.disconnect();
    Logger.info('Database disconnected');
  } catch (error) {
    Logger.error('Character Encyclopedia seeder error:', error);
    await Database.disconnect();
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedCharacterEncyclopedia()
    .then(() => {
      Logger.info('Seeder finished');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error('Seeder error:', error);
      process.exit(1);
    });
}

export { seedCharacterEncyclopedia };
