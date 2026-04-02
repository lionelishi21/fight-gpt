/**
 * Test scraper for Ryu moves only
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

async function testRyuMoves() {
    try {
        Logger.info('Starting Ryu moves test...');

        await Database.connect();

        const repository = new CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService(encyclopediaService);

        const character = await Character.findOne({ name: 'Ryu', game_id: 'sf6', is_current: true });

        if (!character) {
            Logger.error('Ryu not found');
            process.exit(1);
        }

        Logger.info('Scraping Ryu moves...');
        const scrapedData = await scraperService.scrapeCharacter(character.name);

        const normals: Move[] = [];
        const specials: Move[] = [];
        const ex_moves: Move[] = [];
        const supers: Move[] = [];

        for (const section of scrapedData) {
            for (let i = 0; i < section.moves.length; i++) {
                const moveData = section.moves[i];
                if (i === 0) {
                    Logger.info('Raw move data for first move:', JSON.stringify(moveData, null, 2));
                }
                const moveName = moveData['Move'] || moveData['Name'] || 'Unknown Move';

                // Extract input notation from move name
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

                if (moveName.match(/\b(super|super art|critical art)\b/i) || moveData['Damage']?.toString().includes('SA')) {
                    move.category = 'super';
                    supers.push(move);
                } else if (moveData['Cost'] || moveName.match(/\b(od|ex)\b/i)) {
                    move.category = 'ex';
                    ex_moves.push(move);
                } else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i) || moveName.match(/\b(punch|kick)\b/i)) {
                    move.category = 'normal';
                    normals.push(move);
                } else {
                    specials.push(move);
                }
            }
        }

        Logger.info(`Normals: ${normals.length}, Specials: ${specials.length}, EX: ${ex_moves.length}, Supers: ${supers.length}`);
        Logger.info('\nFirst normal:', JSON.stringify(normals[0], null, 2));
        Logger.info('\nFirst special:', JSON.stringify(specials[0], null, 2));

        // Update database
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
            Logger.info('✅ Updated Ryu moves');

            // Verify
            const updated = await CharacterEncyclopedia.findById(existing._id);
            Logger.info(`\nVerification - First normal input: ${updated?.moveset?.normals?.[0]?.input}`);
        }

        await Database.disconnect();
        process.exit(0);

    } catch (error) {
        Logger.error('Error:', error);
        process.exit(1);
    }
}

testRyuMoves();
