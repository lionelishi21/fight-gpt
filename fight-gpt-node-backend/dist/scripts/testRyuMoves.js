"use strict";
/**
 * Test scraper for Ryu moves only
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_js_1 = require("../config/database.js");
const Character_js_1 = require("../models/Character.js");
const CharacterEncyclopedia_js_1 = require("../models/CharacterEncyclopedia.js");
const ScraperService_js_1 = require("../services/ScraperService.js");
const CharacterEncyclopediaService_js_1 = require("../services/CharacterEncyclopediaService.js");
const CharacterEncyclopediaRepository_js_1 = require("../repositories/CharacterEncyclopediaRepository.js");
const logger_js_1 = require("../helpers/logger.js");
dotenv_1.default.config();
async function testRyuMoves() {
    try {
        logger_js_1.Logger.info('Starting Ryu moves test...');
        await database_js_1.Database.connect();
        const repository = new CharacterEncyclopediaRepository_js_1.CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService_js_1.CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService_js_1.ScraperService(encyclopediaService);
        const character = await Character_js_1.Character.findOne({ name: 'Ryu', game_id: 'sf6', is_current: true });
        if (!character) {
            logger_js_1.Logger.error('Ryu not found');
            process.exit(1);
        }
        logger_js_1.Logger.info('Scraping Ryu moves...');
        const scrapedData = await scraperService.scrapeCharacter(character.name);
        const normals = [];
        const specials = [];
        const ex_moves = [];
        const supers = [];
        for (const section of scrapedData) {
            for (const moveData of section.moves) {
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
                const move = {
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
                }
                else if (moveData['Cost'] || moveName.toLowerCase().includes('od') || moveName.toLowerCase().includes('ex')) {
                    move.category = 'ex';
                    ex_moves.push(move);
                }
                else if (inputNotation.match(/^[1-9]?[LMH][PK]$/i) || inputNotation.match(/^(cr|st|j)\./i)) {
                    move.category = 'normal';
                    normals.push(move);
                }
                else {
                    specials.push(move);
                }
            }
        }
        logger_js_1.Logger.info(`Normals: ${normals.length}, Specials: ${specials.length}, EX: ${ex_moves.length}, Supers: ${supers.length}`);
        logger_js_1.Logger.info('\nFirst normal:', JSON.stringify(normals[0], null, 2));
        logger_js_1.Logger.info('\nFirst special:', JSON.stringify(specials[0], null, 2));
        // Update database
        const characterId = character.name.toLowerCase().replace(/\s+/g, '_');
        const existing = await CharacterEncyclopedia_js_1.CharacterEncyclopedia.findOne({
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
        if (existing) {
            await CharacterEncyclopedia_js_1.CharacterEncyclopedia.updateOne({ _id: existing._id }, {
                $set: {
                    moveset: { normals, specials, ex_moves, supers },
                    game_rules: gameRules
                },
                $currentDate: { last_updated: true }
            });
            logger_js_1.Logger.info('✅ Updated Ryu moves');
            // Verify
            const updated = await CharacterEncyclopedia_js_1.CharacterEncyclopedia.findById(existing._id);
            logger_js_1.Logger.info(`\nVerification - First normal input: ${updated?.moveset?.normals?.[0]?.input}`);
        }
        await database_js_1.Database.disconnect();
        process.exit(0);
    }
    catch (error) {
        logger_js_1.Logger.error('Error:', error);
        process.exit(1);
    }
}
testRyuMoves();
//# sourceMappingURL=testRyuMoves.js.map