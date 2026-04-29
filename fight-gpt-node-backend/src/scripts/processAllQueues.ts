import dotenv from 'dotenv';
// Load environment variables before other imports
dotenv.config();

import { AppConfig } from '../config/app';
import { Database } from '../config/database';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { GameRepository } from '../repositories/GameRepository';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { VectorRepository } from '../repositories/VectorRepository';
import { MetaRepository } from '../repositories/MetaRepository';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { IngestionJob } from '../models/IngestionJob';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { RivalRepository } from '../repositories/RivalRepository';

import { AnalysisService } from '../services/AnalysisService';
import { AiService } from '../services/AiService';
import { CharacterService } from '../services/CharacterService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { MetaService } from '../services/MetaService';
import { IngestionService } from '../services/IngestionService';

async function main() {
    // Validate configuration
    AppConfig.validate();

    await Database.connect();
    console.log('Connected to MongoDB.');

    // Repositories
    const analysisRepository = new AnalysisRepository();
    const characterRepository = new CharacterRepository();
    const gameRepository = new GameRepository();
    const gameMetadataRepository = new GameMetadataRepository();
    const characterEncyclopediaRepository = new CharacterEncyclopediaRepository();
    const vectorRepository = new VectorRepository();
    const metaRepository = new MetaRepository();
    const ingestionRepository = new IngestionRepository();
    const notificationRepository = new NotificationRepository();
    const rivalRepository = new RivalRepository();

    // Services
    const gameMetadataService = new GameMetadataService(gameMetadataRepository);
    const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepository);
    
    const aiService = new AiService(
      AppConfig.GEMINI_API_KEY,
      AppConfig.GEMINI_MODEL,
      gameMetadataService,
      characterEncyclopediaService
    );

    const characterService = new CharacterService(characterRepository, gameRepository);

    const analysisService = new AnalysisService(
      analysisRepository,
      aiService,
      gameMetadataService,
      characterEncyclopediaService,
      characterService,
      vectorRepository,
      notificationRepository,
      rivalRepository
    );

    const ingestionService = new IngestionService(ingestionRepository, analysisService);
    
    const metaService = new MetaService(metaRepository, vectorRepository, AppConfig.GEMINI_API_KEY);

    console.log('--- STARTING BULK INGESTION PROCESS ---');
    
    // Reset failed jobs to pending to retry with new model/quota
    console.log('[DEBUG] Resetting failed jobs to pending...');
    await IngestionJob.updateMany({ status: 'failed' }, { status: 'pending' });

    // Process SF6
    console.log('\n[SF6] Processing backlog...');
    const sf6Res = await ingestionService.processQueue('sf6', 10);
    console.log(`[SF6] Result: ${JSON.stringify(sf6Res.data)}`);

    // Process Tekken 8
    console.log('\n[TEKKEN8] Processing backlog...');
    const t8Res = await ingestionService.processQueue('tekken8', 5);
    console.log(`[TEKKEN8] Result: ${JSON.stringify(t8Res.data)}`);

    // Generate Meta Reports if successful
    if (sf6Res.success && (sf6Res.data?.processed || 0) > 0) {
        console.log('\n[SF6] Generating Meta Report...');
        await metaService.generateMetaReport('sf6', 'weekly');
    }

    if (t8Res.success && (t8Res.data?.processed || 0) > 0) {
        console.log('\n[TEKKEN8] Generating Meta Report...');
        await metaService.generateMetaReport('tekken8', 'weekly');
    }

    console.log('\n--- BULK PROCESS COMPLETE ---');
    await Database.disconnect();
}

main().catch(err => {
    console.error('Process failed:', err);
    process.exit(1);
});
