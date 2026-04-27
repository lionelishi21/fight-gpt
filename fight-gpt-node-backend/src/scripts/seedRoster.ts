import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Character } from '../models/Character';
import { ScraperService } from '../services/ScraperService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedRoster() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not defined in the environment variables.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully.');

        // Initialize Scraper (passing null since we only need scrapeRoster, not encyclopedia right now)
        const scraper = new ScraperService(null as any);
        
        console.log('Scraping SF6 roster...');
        const sf6Roster = await scraper.scrapeRoster('sf6');
        
        console.log(`Processing ${sf6Roster.length} SF6 characters...`);
        for (const char of sf6Roster) {
            const existingChar = await Character.findOne({ game_id: 'sf6', name: char.name });
            
            if (existingChar) {
                // If it exists, maybe update status if it changed from coming_soon to released
                if (existingChar.status !== char.status) {
                    existingChar.status = char.status as any;
                    await existingChar.save();
                    console.log(`[UPDATE] ${char.name} status updated to ${char.status}`);
                } else {
                    console.log(`[SKIP] ${char.name} already exists with status ${char.status}`);
                }
            } else {
                // Insert new character
                const newChar = new Character({
                    game_id: 'sf6',
                    name: char.name,
                    version: '1.0',
                    is_current: true,
                    status: char.status,
                    stats: {},
                    moves: []
                });
                await newChar.save();
                console.log(`[NEW] Inserted ${char.name} with status ${char.status}`);
            }
        }

        // Hardcoded basic Tekken 8 roster as requested
        const tekken8Roster = [
            { name: 'Jin Kazama', status: 'released' },
            { name: 'Kazuya Mishima', status: 'released' },
            { name: 'Jun Kazama', status: 'released' },
            { name: 'King', status: 'released' },
            { name: 'Paul Phoenix', status: 'released' },
            { name: 'Marshall Law', status: 'released' },
            { name: 'Nina Williams', status: 'released' },
            { name: 'Jack-8', status: 'released' },
            { name: 'Yoshimitsu', status: 'released' },
            { name: 'Eddy Gordo', status: 'released' }, // DLC 1
            { name: 'Lidia Sobieska', status: 'released' }, // DLC 2
            { name: 'Heihachi Mishima', status: 'released' }, // DLC 3
            { name: 'Clive Rosfield', status: 'coming_soon' } // Placeholder for future DLC or guest
        ];

        console.log('\nProcessing Tekken 8 characters...');
        for (const char of tekken8Roster) {
            const existingChar = await Character.findOne({ game_id: 'tekken8', name: char.name });
            if (existingChar) {
                if (existingChar.status !== char.status) {
                    existingChar.status = char.status as any;
                    await existingChar.save();
                    console.log(`[UPDATE] ${char.name} status updated to ${char.status}`);
                } else {
                    console.log(`[SKIP] ${char.name} already exists with status ${char.status}`);
                }
            } else {
                const newChar = new Character({
                    game_id: 'tekken8',
                    name: char.name,
                    version: '1.0',
                    is_current: true,
                    status: char.status,
                    stats: {},
                    moves: []
                });
                await newChar.save();
                console.log(`[NEW] Inserted ${char.name} with status ${char.status}`);
            }
        }

    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
        process.exit(0);
    }
}

seedRoster();
