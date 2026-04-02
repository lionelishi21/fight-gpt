/**
 * SF6 Scraper Script
 * Scrapes character data from SuperCombo wiki and updates the CharacterEncyclopedia
 */

import dotenv from 'dotenv';
import { Database } from '../config/database';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { ScraperService } from '../services/ScraperService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { Logger } from '../helpers/logger';
import { Move, GameRule } from '../types/characterEncyclopedia';

// Load environment variables
dotenv.config();

async function runScraper() {
    try {
        Logger.info('Starting SF6 Scraper...');

        // Connect to database
        await Database.connect();
        Logger.info('Database connected');

        // Initialize services
        const repository = new CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService(encyclopediaService);

        // Get all SF6 characters
        const characters = await Character.find({ game_id: 'sf6', is_current: true });
        Logger.info(`Found ${characters.length} SF6 characters to scrape`);

        for (const character of characters) {
            try {
                const characterId = character.name.toLowerCase().replace(/\s+/g, '_');
                Logger.info(`Scraping data for ${character.name}...`);

                const scrapedData = await scraperService.scrapeCharacter(character.name);

                if (!scrapedData || scrapedData.length === 0) {
                    Logger.warn(`No data found for ${character.name}`);
                    continue;
                }

                // Scrape YouTube videos for the character
                Logger.info(`Scraping YouTube videos for ${character.name}...`);
                const guides = await scraperService.scrapeYouTube(`${character.name} SF6 guide`);
                const matches = await scraperService.scrapeYouTube(`${character.name} SF6 high level replays`);

                const videos: any[] = [
                    ...guides.map(v => ({ ...v, category: 'guide' })),
                    ...matches.map(v => ({ ...v, category: 'match' }))
                ];

                // Scrape Combos for the character
                Logger.info(`Scraping combos for ${character.name}...`);
                const combos = await scraperService.scrapeCombos(character.name);

                // Map scraped data to Encyclopedia format
                const normals: Move[] = [];
                const specials: Move[] = [];
                const ex_moves: Move[] = [];
                const supers: Move[] = [];

                // Heuristic mapping (this is simplified and would need refinement based on actual wiki structure)
                for (const section of scrapedData) {
                    for (const moveData of section.moves) {
                        const moveName = moveData['Move'] || moveData['Name'] || 'Unknown Move';

                        // Extract input notation from move name (e.g., "5LP\nStanding Light Punch" -> "5LP")
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
                            category: 'special', // Default
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

                        // Simple categorization based on name or section
                        if (moveName.toLowerCase().includes('super') || moveName.toLowerCase().includes('art') || moveName.toLowerCase().includes('critical')) {
                            move.category = 'super';
                            supers.push(move);
                        } else if (moveData['Cost'] || moveName.toLowerCase().includes('od') || moveName.toLowerCase().includes('ex')) {
                            move.category = 'ex';
                            ex_moves.push(move);
                        } else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i)) {
                            // Normals: 5LP, 2MK, cr.HP, st.MP, j.HK, etc.
                            move.category = 'normal';
                            normals.push(move);
                        } else {
                            specials.push(move);
                        }
                    }
                }

                // Get existing rules or use defaults
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

                const encyclopediaRequest = {
                    game_id: 'sf6',
                    character_id: characterId,
                    patch_version: '1.05',
                    is_current_patch: true,
                    moveset: {
                        normals,
                        specials,
                        ex_moves,
                        supers,
                    },
                    game_rules: gameRules,
                    videos: videos,
                    combos: combos,
                };

                if (existing) {
                    await CharacterEncyclopedia.updateOne(
                        { _id: existing._id },
                        { $set: encyclopediaRequest, $currentDate: { last_updated: true } }
                    );
                    Logger.info(`✅ Updated Encyclopedia for ${character.name}`);
                } else {
                    const newEnc = new CharacterEncyclopedia(encyclopediaRequest);
                    await newEnc.save();
                    Logger.info(`✅ Created Encyclopedia for ${character.name}`);
                }

            } catch (error) {
                Logger.error(`Error processing ${character.name}:`, error);
            }
        }

        await Database.disconnect();
        Logger.info('SF6 Scraper finished');
        process.exit(0);

    } catch (error) {
        Logger.error('Scraper fatal error:', error);
        await Database.disconnect();
        process.exit(1);
    }
}

runScraper();
