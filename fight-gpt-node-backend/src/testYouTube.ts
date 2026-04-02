import { ScraperService } from './services/ScraperService';
import { CharacterEncyclopediaService } from './services/CharacterEncyclopediaService';
import { CharacterEncyclopediaRepository } from './repositories/CharacterEncyclopediaRepository';
import { Database } from './config/database';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
    await Database.connect();
    const repo = new CharacterEncyclopediaRepository();
    const service = new CharacterEncyclopediaService(repo);
    const scraper = new ScraperService(service);

    const videos = await scraper.scrapeYouTube('Ryu SF6 guide');
    console.log('Scraped Videos:', JSON.stringify(videos, null, 2));

    await scraper.close();
    await Database.disconnect();
}

test();
