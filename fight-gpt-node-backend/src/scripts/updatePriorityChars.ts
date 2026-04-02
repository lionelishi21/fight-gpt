/**
 * Quick update for popular characters
 */

import dotenv from 'dotenv';
import { Database } from '../config/database.js';
import { Character } from '../models/Character.js';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia.js';
import { ScraperService } from '../services/ScraperService.js';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService.js';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository.js';
import { Logger } from '../helpers/logger.js';
import { Move, GameRule } from '../types/characterEncyclopedia.js';

dotenv.config();

const PRIORITY_CHARACTERS = ['Ken', 'Chun-Li', 'Cammy', 'Guile', 'Juri'];

async function updatePriorityCharacters() {
    try {
        Logger.info('Starting priority character updates...');

        await Database.connect();

        const repository = new CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService(encyclopediaService);

        for (const charName of PRIORITY_CHARACTERS) {
            try {
                const character = await Character.findOne({ name: charName, game_id: 'sf6', is_current: true });

                if (!character) {
                    Logger.warn(`${charName} not found`);
                    continue;
                }

                Logger.info(`Processing ${charName}...`);
                const scrapedData = await scraperService.scrapeCharacter(character.name);

                const normals: Move[] = [];
                const specials: Move[] = [];
                const ex_moves: Move[] = [];
                const supers: Move[] = [];

                for (const section of scrapedData) {
                    for (const moveData of section.moves) {
                        const moveName = moveData['Move'] || moveData['Name'] || 'Unknown Move';

                        const nameLines = moveName.split('\n');
                        const inputNotation = nameLines[0]?.trim() || 'N/A';
                        const fullMoveName = nameLines.length > 1 ? nameLines.slice(1).join(' ').trim() : moveName;

                        const startup = parseInt(moveData['Startup']) || 0;
                        const active = parseInt(moveData['Active']) || 0;
                        const recovery = parseInt(moveData['Recovery']) || 0;
                        const onBlock = parseInt(moveData['On Block']) || 0;
                        const onHit = parseInt(moveData['On Hit']) || 0;
                        const damage = parseInt(moveData['Damage']) || 0;

                        const move: Move = {
                            name: fullMoveName || inputNotation,
                            input: inputNotation,
                            how_to_perform: fullMoveName || inputNotation,
                            category: 'special',
                            properties: [],
                            frame_data: {
                                startup,
                                active,
                                recovery,
                                on_block: onBlock,
                                on_hit: onHit,
                                damage,
                            }
                        };

                        if (moveName.toLowerCase().includes('super') || moveName.toLowerCase().includes('art') || moveName.toLowerCase().includes('critical')) {
                            move.category = 'super';
                            supers.push(move);
                        } else if (moveData['Cost'] || moveName.toLowerCase().includes('od') || moveName.toLowerCase().includes('ex')) {
                            move.category = 'ex';
                            ex_moves.push(move);
                        } else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i)) {
                            move.category = 'normal';
                            normals.push(move);
                        } else {
                            specials.push(move);
                        }
                    }
                }

                const characterId = character.name.toLowerCase().replace(/\s+/g, '_');
                const existing = await CharacterEncyclopedia.findOne({
                    game_id: 'sf6',
                    character_id: characterId,
                    is_current_patch: true,
                });

                const gameRules: GameRule[] = existing?.game_rules || [
                    {
                        key: 'Drive Gauge',
                        value: 6,
                        ui_type: 'meter',
                        description: 'System gauge used for Drive Rush, Drive Impact, etc.',
                    }
                ];

                if (existing) {
                    await CharacterEncyclopedia.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                moveset: { normals, specials, ex_moves, supers },
                                game_rules: gameRules
                            },
                            $currentDate: { last_updated: true }
                        }
                    );
                    Logger.info(`✅ Updated ${charName} (${normals.length} normals, ${specials.length} specials)`);
                }
            } catch (error) {
                Logger.error(`Error processing ${charName}:`, error);
            }
        }

        await Database.disconnect();
        Logger.info('Priority updates complete!');
        process.exit(0);

    } catch (error) {
        Logger.error('Error:', error);
        process.exit(1);
    }
}

updatePriorityCharacters();
