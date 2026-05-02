"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const CharacterEncyclopediaRepository_1 = require("../repositories/CharacterEncyclopediaRepository");
const CharacterEncyclopediaService_1 = require("../services/CharacterEncyclopediaService");
const ScraperService_1 = require("../services/ScraperService");
const logger_1 = require("../helpers/logger");
dotenv_1.default.config();
async function testScrape() {
    try {
        logger_1.Logger.info('Starting Test Scrape for Ken...');
        // Mock DB connection or just don't connect if not strictly needed for the scraper *unit* test, 
        // but the service might depend on it if it saves, but here we just want to see the output.
        // The ScraperService.scrapeCharacter returns data, it doesn't save it itself (the script does).
        const repository = new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService_1.CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService_1.ScraperService(encyclopediaService);
        // Test 1: Frame Data
        console.log('--- Scraping Frame Data ---');
        const scrapedData = await scraperService.scrapeCharacter('Ken');
        console.log(`Scraped ${scrapedData.length} sections.`);
        scrapedData.forEach((section) => {
            console.log(`Section: ${section.section}, Moves: ${section.moves.length}`);
            if (section.moves.length > 0) {
                console.log('Sample Move:', JSON.stringify(section.moves[0], null, 2));
            }
        });
        // Test 2: Combos
        console.log('--- Scraping Combos ---');
        const combos = await scraperService.scrapeCombos('Ken');
        console.log(`Scraped ${combos.length} combos.`);
        if (combos.length > 0) {
            console.log('Sample Combo:', JSON.stringify(combos[0], null, 2));
        }
    }
    catch (error) {
        console.error('Test failed:', error);
    }
    finally {
        process.exit(0);
    }
}
testScrape();
//# sourceMappingURL=test_scrape.js.map