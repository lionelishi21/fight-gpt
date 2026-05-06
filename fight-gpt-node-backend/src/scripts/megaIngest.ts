import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { IngestionService } from '../services/IngestionService';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { AnalysisService } from '../services/AnalysisService';
import { AiService } from '../services/AiService';
import { GameMetadataService } from '../services/GameMetadataService';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { CharacterService } from '../services/CharacterService';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { GameRepository } from '../repositories/GameRepository';
import { Logger } from '../helpers/logger';
import { AppConfig } from '../config/app';

async function runMegaIngest() {
    try {
        Logger.info('🚀 STARTING MEGA INGESTION (SF6, TEKKEN 8, GGST)');
        
        // 1. Connect DB
        await Database.connect();
        
        // 2. Initialize Dependency Chain
        const ingestionRepo = new IngestionRepository();
        const gameMetadataRepo = new GameMetadataRepository();
        const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
        const characterRepo = new CharacterRepository();
        const gameRepo = new GameRepository();

        const gameMetadataService = new GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);
        const characterService = new CharacterService(characterRepo, gameRepo);
        
        const aiService = new AiService(
            AppConfig.GEMINI_API_KEY,
            AppConfig.GEMINI_MODEL,
            gameMetadataService,
            characterEncyclopediaService
        );

        // Analysis service (needed for IngestionService constructor)
        const analysisService = {} as any; 

        const ingestionService = new IngestionService(
            ingestionRepo,
            analysisService
        );

        // 3. Trigger Ingestion for major games
        const games = [
            { id: 'sf6', count: 30 },
            { id: 'tekken8', count: 20 },
            { id: 'ggst', count: 15 }
        ];

        for (const game of games) {
            Logger.info(`📡 Searching YouTube for new ${game.id.toUpperCase()} footage...`);
            const result = await ingestionService.triggerIngestion(game.id, game.count);
            
            if (result.success && result.data) {
                Logger.info(`✅ ${game.id.toUpperCase()}: ${result.data.queued_count} NEW JOBS ADDED, ${result.data.skipped_count} ALREADY EXIST.`);
            } else {
                Logger.error(`❌ FAILED TO INGEST ${game.id.toUpperCase()}:`, result.error);
            }
        }

        Logger.info('🎉 Mega Ingestion complete! The worker will now begin processing the new queue.');
        process.exit(0);
    } catch (e) {
        Logger.error('Mega Ingestion CRASHED:', e);
        process.exit(1);
    }
}

runMegaIngest();
