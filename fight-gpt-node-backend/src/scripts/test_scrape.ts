
import dotenv from 'dotenv';
import { Database } from '../config/database';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { ScraperService } from '../services/ScraperService';
import { Logger } from '../helpers/logger';

dotenv.config();

async function testScrape() {
    try {
        Logger.info('Starting Test Scrape for Ken...');

        // Mock DB connection or just don't connect if not strictly needed for the scraper *unit* test, 
        // but the service might depend on it if it saves, but here we just want to see the output.
        // The ScraperService.scrapeCharacter returns data, it doesn't save it itself (the script does).

        const repository = new CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService(encyclopediaService);

        // Test 1: Frame Data
        console.log('--- Scraping Frame Data ---');
        const scrapedData = await scraperService.scrapeCharacter('Ken');
        console.log(`Scraped ${scrapedData.length} sections.`);
        scrapedData.forEach((section: any) => {
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

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
}

testScrape();
