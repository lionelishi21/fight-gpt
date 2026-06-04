import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { SystemSettings } from '../models/SystemSettings';
import { queueService } from '../services/QueueService';

async function run() {
    console.log('Connecting to database...');
    await Database.connect();

    try {
        console.log('Fetching system settings...');
        const settings = await SystemSettings.getSettings();
        
        console.log(`Current active provider: ${settings.active_ai_provider}`);
        settings.active_ai_provider = 'bedrock';
        await settings.save();
        console.log('Changed active AI provider to: bedrock');

        console.log('Resuming BullMQ Analysis Queue...');
        await queueService.resumeQueue();
        console.log('✅ Queue successfully resumed!');

    } catch (e) {
        console.error('Failed to update settings and resume queue:', e);
    } finally {
        await Database.disconnect();
        console.log('Database disconnected.');
        process.exit(0);
    }
}

run();
