import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { Analysis } from '../models/Analysis';
import { AnalysisService } from '../services/AnalysisService';
import { AiService } from '../services/AiService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { CharacterService } from '../services/CharacterService';
import { VectorRepository } from '../repositories/VectorRepository';
import { NotificationService } from '../services/NotificationService';
import { RivalRepository } from '../repositories/RivalRepository';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { GameRepository } from '../repositories/GameRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { AppConfig } from '../config/app';

async function run() {
    try {
        console.log('--- RE-VECTORIZING ALL ANALYSES ---');
        await Database.connect();

        // 1. Initialize Repositories
        const analysisRepo = new AnalysisRepository();
        const gameMetadataRepo = new GameMetadataRepository();
        const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
        const characterRepo = new CharacterRepository();
        const gameRepo = new GameRepository();
        const vectorRepo = new VectorRepository();
        const notificationRepo = new NotificationRepository();
        const rivalRepo = new RivalRepository();

        // 2. Initialize Services
        const gameMetadataService = new GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);
        const characterService = new CharacterService(characterRepo, gameRepo);
        const notificationService = new NotificationService(notificationRepo);
        
        const aiService = new AiService(
            AppConfig.GEMINI_API_KEY,
            AppConfig.GEMINI_MODEL,
            gameMetadataService,
            characterEncyclopediaService
        );

        const analysisService = new AnalysisService(
            analysisRepo,
            aiService,
            gameMetadataService,
            characterEncyclopediaService,
            characterService,
            vectorRepo,
            notificationService,
            rivalRepo
        );

        // 3. Fetch all analyses
        const allAnalyses = await Analysis.find({}).lean().exec();
        console.log(`Found ${allAnalyses.length} analyses to process.`);

        for (const doc of allAnalyses) {
            console.log(`Processing ${doc.analysis_id} (${doc.youtube_url})...`);
            
            const request = {
                youtube_url: doc.youtube_url,
                game_id: doc.game_id,
                pro_player_id: (doc as any).pro_player_id
            };

            await analysisService.processVectorIntelligence(
                doc.analysis_id,
                request as any,
                doc.analysis as any
            );
        }

        console.log('--- FINISHED RE-VECTORIZATION ---');
        process.exit(0);
    } catch (error) {
        console.error('Re-vectorization failed:', error);
        process.exit(1);
    }
}

run();
