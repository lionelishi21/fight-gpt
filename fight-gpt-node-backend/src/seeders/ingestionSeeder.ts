import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { IngestionJob } from '../models/IngestionJob';
import { UuidHelper } from '../helpers/uuidHelper';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SF6_TOURNAMENT_URLS = [
    'https://www.youtube.com/watch?v=M5L_2B6Q9sI', // SF6 Top 8 Example
    'https://www.youtube.com/watch?v=M-5T-9Q999I',
    'https://www.youtube.com/watch?v=n7kLzN2_nUo',
    'https://www.youtube.com/watch?v=P_YvH0_A89c',
    'https://www.youtube.com/watch?v=SF6_TOP8_TAMPA',
];

async function seedIngestion() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        let added = 0;
        for (const url of SF6_TOURNAMENT_URLS) {
            const existing = await IngestionJob.findOne({ youtube_url: url });
            if (!existing) {
                await IngestionJob.create({
                    job_id: UuidHelper.generate(),
                    game_id: 'sf6',
                    youtube_url: url,
                    search_query: 'Manual Seed',
                    source: 'manual',
                    status: 'pending',
                    retry_count: 0
                });
                console.log(`Queued: ${url}`);
                added++;
            } else {
                console.log(`Skipped (exists): ${url}`);
            }
        }

        console.log(`Seeding complete. Added ${added} jobs.`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedIngestion();
