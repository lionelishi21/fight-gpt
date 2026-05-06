import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { IngestionService } from '../services/IngestionService';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { ProPlayer } from '../models/ProPlayer';
import { Logger } from '../helpers/logger';

async function testDirectIngestion() {
    try {
        await Database.connect();
        
        // Ensure Capcom Fighters exists with correct ID
        await ProPlayer.updateOne(
            { name: 'Capcom Fighters' },
            { 
                $set: { 
                    channels: ['UC_a19p83c07_6m67w6R3tPA'], // Corrected Capcom Fighters ID
                    isVerified: true,
                    gameId: 'sf6'
                } 
            },
            { upsert: true }
        );

        const ingestionRepo = new IngestionRepository();
        const ingestionService = new IngestionService(
            ingestionRepo,
            {} as any 
        );

        Logger.info('🚀 TRIGGERING DIRECT PLAYLIST INGESTION (1 UNIT COST)...');
        await (ingestionService as any).ingestProPlayersDirect();
        
        Logger.info('✅ Direct Scan complete.');
        process.exit(0);
    } catch (e) {
        Logger.error('Direct Test Failed:', e);
        process.exit(1);
    }
}

testDirectIngestion();
