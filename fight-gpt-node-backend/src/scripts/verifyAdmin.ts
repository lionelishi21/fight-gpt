import { Database } from '../config/database';
import { AdminService } from '../services/AdminService';
import { IngestionService } from '../services/IngestionService';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { AnalysisService } from '../services/AnalysisService';
import { AiService } from '../services/AiService';
import { GameMetadataService } from '../services/GameMetadataService';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { IngestionJob } from '../models/IngestionJob';

/**
 * Dry-run verification script for Admin functionalities.
 * Using 'any' to bypass strict dependency injection typing for verification.
 */
async function verify() {
    console.log('--- STARTING ADMIN FUNCTIONALITY VERIFICATION ---');
    
    try {
        // 1. Connect to DB
        process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fightgpt_test';
        await Database.connect();
        console.log('✅ Database connected');

        // 2. Initialize Services (casted to any to bypass strict constructor typing in script)
        const adminService = new AdminService() as any;
        const ingestionRepo = new IngestionRepository() as any;
        const analysisRepo = new AnalysisRepository() as any;
        const aiService = new AiService() as any;
        const gameMetaRepo = new GameMetadataRepository() as any;
        const gameMetaService = new GameMetadataService(gameMetaRepo) as any;
        const characterEncRepo = new CharacterEncyclopediaRepository() as any;
        const characterEncService = new CharacterEncyclopediaService(characterEncRepo) as any;
        
        // Match the 4 required params from AnalysisService.ts
        const analysisService = new AnalysisService(
            analysisRepo, 
            aiService, 
            gameMetaService, 
            characterEncService
        ) as any;
        
        const ingestionService = new IngestionService(ingestionRepo, analysisService) as any;

        // 3. Test Stats
        console.log('Testing getSystemStats...');
        const stats = await adminService.getSystemStats();
        if (stats.success) {
            console.log('✅ getSystemStats: PASSED');
        } else {
            console.log('❌ getSystemStats: FAILED', stats.error);
        }

        // 4. Test Game Creation & Patch Bumping logic
        const testGameId = 'test_verify_game';
        await Game.deleteOne({ game_id: testGameId });
        await Character.deleteMany({ game_id: testGameId });
        
        await Game.create({
            game_id: testGameId,
            name: 'Verification Test Game',
            latest_version: '1.0',
            is_active: true
        });
        
        await Character.create({
            game_id: testGameId,
            name: 'Test Fighter',
            character_id: 'test_fighter',
            version: '1.0',
            stats: {},
            moves: [],
            is_current: true
        });

        console.log('Testing Patch Bumping logic...');
        // Simulating AdminController logic
        await Game.findOneAndUpdate({ game_id: testGameId }, { latest_version: '1.1' });
        const bumpRes = await characterEncRepo.bumpPatchVersion(testGameId, 'test_fighter', '1.1');
        
        if (bumpRes) {
            console.log('✅ bumpPatch logic: PASSED');
        } else {
            console.log('❌ bumpPatch logic: FAILED');
        }

        // 5. Test Manual Ingestion Trigger
        console.log('Testing Manual Ingestion Trigger...');
        const manualJobRes = await adminService.triggerManualUrl(testGameId, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        if (manualJobRes.success) {
            console.log('✅ triggerManualUrl: PASSED');
            await IngestionJob.deleteOne({ job_id: manualJobRes.data.job_id });
        } else {
            console.log('❌ triggerManualUrl: FAILED', manualJobRes.error);
        }

        // 6. Test Ingestion Seed
        console.log('Testing Ingestion Seeding...');
        const seedRes = await adminService.seedUrls(testGameId, [
            'https://www.youtube.com/watch?v=seed1',
            'https://www.youtube.com/watch?v=seed2'
        ]);
        if (seedRes.success && seedRes.data?.queued === 2) {
            console.log('✅ seedUrls: PASSED');
        } else {
            console.log('❌ seedUrls: FAILED', seedRes.error);
        }

        // Cleanup
        await Game.deleteOne({ game_id: testGameId });
        await Character.deleteMany({ game_id: testGameId });
        await IngestionJob.deleteMany({ game_id: testGameId });

        console.log('--- VERIFICATION COMPLETE ---');
        await Database.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ CRITICAL VERIFICATION ERROR:', error);
        process.exit(1);
    }
}

verify();
