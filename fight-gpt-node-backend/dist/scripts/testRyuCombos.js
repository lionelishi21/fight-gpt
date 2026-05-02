"use strict";
/**
 * Test scraper for Ryu only
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
async function testRyuScraper() {
    try {
        logger_js_1.Logger.info('Starting Ryu test scraper...');
        await database_js_1.Database.connect();
        logger_js_1.Logger.info('Database connected');
        const repository = new CharacterEncyclopediaRepository_js_1.CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService_js_1.CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService_js_1.ScraperService(encyclopediaService);
        const character = await Character_js_1.Character.findOne({ name: 'Ryu', game_id: 'sf6', is_current: true });
        if (!character) {
            logger_js_1.Logger.error('Ryu not found');
            process.exit(1);
        }
        logger_js_1.Logger.info('Scraping combos for Ryu...');
        const combos = await scraperService.scrapeCombos(character.name);
        logger_js_1.Logger.info(`Found ${combos.length} combos`);
        logger_js_1.Logger.info('First combo:', JSON.stringify(combos[0], null, 2));
        // Now update the encyclopedia
        const characterId = character.name.toLowerCase().replace(/\s+/g, '_');
        const existing = await CharacterEncyclopedia_js_1.CharacterEncyclopedia.findOne({
            game_id: 'sf6',
            character_id: characterId,
            is_current_patch: true,
        });
        if (existing) {
            logger_js_1.Logger.info('Updating existing encyclopedia with combos...');
            await CharacterEncyclopedia_js_1.CharacterEncyclopedia.updateOne({ _id: existing._id }, {
                $set: { combos: combos },
                $currentDate: { last_updated: true }
            });
            logger_js_1.Logger.info('✅ Updated');
            // Verify
            const updated = await CharacterEncyclopedia_js_1.CharacterEncyclopedia.findById(existing._id);
            logger_js_1.Logger.info(`Verification: combos count = ${updated?.combos?.length || 0}`);
        }
        else {
            logger_js_1.Logger.error('No existing encyclopedia found');
        }
        await database_js_1.Database.disconnect();
        process.exit(0);
    }
    catch (error) {
        logger_js_1.Logger.error('Error:', error);
        process.exit(1);
    }
}
testRyuScraper();
//# sourceMappingURL=testRyuCombos.js.map