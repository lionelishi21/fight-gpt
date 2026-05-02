"use strict";
/**
 * SF6 Scraper Script
 * Scrapes character data from SuperCombo wiki and updates the CharacterEncyclopedia
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const Character_1 = require("../models/Character");
const CharacterEncyclopedia_1 = require("../models/CharacterEncyclopedia");
const ScraperService_1 = require("../services/ScraperService");
const CharacterEncyclopediaService_1 = require("../services/CharacterEncyclopediaService");
const CharacterEncyclopediaRepository_1 = require("../repositories/CharacterEncyclopediaRepository");
const logger_1 = require("../helpers/logger");
// Load environment variables
dotenv_1.default.config();
async function runScraper() {
    try {
        logger_1.Logger.info('Starting SF6 Scraper...');
        // Connect to database
        await database_1.Database.connect();
        logger_1.Logger.info('Database connected');
        // Initialize services
        const repository = new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService_1.CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService_1.ScraperService(encyclopediaService);
        // Get all SF6 characters
        const characters = await Character_1.Character.find({ game_id: 'sf6', is_current: true });
        logger_1.Logger.info(`Found ${characters.length} SF6 characters to scrape`);
        for (const character of characters) {
            try {
                const characterId = character.name.toLowerCase().replace(/\s+/g, '_');
                logger_1.Logger.info(`Scraping data for ${character.name}...`);
                const scrapedData = await scraperService.scrapeCharacter(character.name);
                if (!scrapedData || scrapedData.length === 0) {
                    logger_1.Logger.warn(`No data found for ${character.name}`);
                    continue;
                }
                // Scrape YouTube videos for the character
                logger_1.Logger.info(`Scraping YouTube videos for ${character.name}...`);
                const guides = await scraperService.scrapeYouTube(`${character.name} SF6 guide`);
                const matches = await scraperService.scrapeYouTube(`${character.name} SF6 high level replays`);
                const videos = [
                    ...guides.map(v => ({ ...v, category: 'guide' })),
                    ...matches.map(v => ({ ...v, category: 'match' }))
                ];
                // Scrape Combos for the character
                logger_1.Logger.info(`Scraping combos for ${character.name}...`);
                const combos = await scraperService.scrapeCombos(character.name);
                // Map scraped data to Encyclopedia format
                const normals = [];
                const specials = [];
                const ex_moves = [];
                const supers = [];
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
                        const move = {
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
                        }
                        else if (moveData['Cost'] || moveName.toLowerCase().includes('od') || moveName.toLowerCase().includes('ex')) {
                            move.category = 'ex';
                            ex_moves.push(move);
                        }
                        else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i)) {
                            // Normals: 5LP, 2MK, cr.HP, st.MP, j.HK, etc.
                            move.category = 'normal';
                            normals.push(move);
                        }
                        else {
                            specials.push(move);
                        }
                    }
                }
                // Get existing rules or use defaults
                const existing = await CharacterEncyclopedia_1.CharacterEncyclopedia.findOne({
                    game_id: 'sf6',
                    character_id: characterId,
                    is_current_patch: true,
                });
                const gameRules = existing?.game_rules || [
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
                    await CharacterEncyclopedia_1.CharacterEncyclopedia.updateOne({ _id: existing._id }, { $set: encyclopediaRequest, $currentDate: { last_updated: true } });
                    logger_1.Logger.info(`✅ Updated Encyclopedia for ${character.name}`);
                }
                else {
                    const newEnc = new CharacterEncyclopedia_1.CharacterEncyclopedia(encyclopediaRequest);
                    await newEnc.save();
                    logger_1.Logger.info(`✅ Created Encyclopedia for ${character.name}`);
                }
            }
            catch (error) {
                logger_1.Logger.error(`Error processing ${character.name}:`, error);
            }
        }
        await database_1.Database.disconnect();
        logger_1.Logger.info('SF6 Scraper finished');
        process.exit(0);
    }
    catch (error) {
        logger_1.Logger.error('Scraper fatal error:', error);
        await database_1.Database.disconnect();
        process.exit(1);
    }
}
runScraper();
//# sourceMappingURL=scrapeSF6.js.map