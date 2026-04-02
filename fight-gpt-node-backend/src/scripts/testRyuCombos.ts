/**
 * Test scraper for Ryu only
 */

import dotenv from 'dotenv';
import { Database } from '../config/database.js';
import { Character } from '../models/Character.js';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia.js';
import { ScraperService } from '../services/ScraperService.js';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService.js';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository.js';
import { Logger } from '../helpers/logger.js';

dotenv.config();

async function testRyuScraper() {
    try {
        Logger.info('Starting Ryu test scraper...');

        await Database.connect();
        Logger.info('Database connected');

        const repository = new CharacterEncyclopediaRepository();
        const encyclopediaService = new CharacterEncyclopediaService(repository);
        const scraperService = new ScraperService(encyclopediaService);

        const character = await Character.findOne({ name: 'Ryu', game_id: 'sf6', is_current: true });

        if (!character) {
            Logger.error('Ryu not found');
            process.exit(1);
        }

        Logger.info('Scraping combos for Ryu...');
        const combos = await scraperService.scrapeCombos(character.name);

        Logger.info(`Found ${combos.length} combos`);
        Logger.info('First combo:', JSON.stringify(combos[0], null, 2));

        // Now update the encyclopedia
        const characterId = character.name.toLowerCase().replace(/\s+/g, '_');
        const existing = await CharacterEncyclopedia.findOne({
            game_id: 'sf6',
            character_id: characterId,
            is_current_patch: true,
        });

        if (existing) {
            Logger.info('Updating existing encyclopedia with combos...');
            await CharacterEncyclopedia.updateOne(
                { _id: existing._id },
                {
                    $set: { combos: combos },
                    $currentDate: { last_updated: true }
                }
            );
            Logger.info('✅ Updated');

            // Verify
            const updated = await CharacterEncyclopedia.findById(existing._id);
            Logger.info(`Verification: combos count = ${updated?.combos?.length || 0}`);
        } else {
            Logger.error('No existing encyclopedia found');
        }

        await Database.disconnect();
        process.exit(0);

    } catch (error) {
        Logger.error('Error:', error);
        process.exit(1);
    }
}

testRyuScraper();
