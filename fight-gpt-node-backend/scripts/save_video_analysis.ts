import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { Database } from '../src/config/database';
import { IngestionJob } from '../src/models/IngestionJob';
import { Analysis } from '../src/models/Analysis';
import { UuidHelper } from '../src/helpers/uuidHelper';

import { AppConfig } from '../src/config/app';
import { AiService } from '../src/services/AiService';
import { AnalysisService } from '../src/services/AnalysisService';
import { GameMetadataService } from '../src/services/GameMetadataService';
import { CharacterEncyclopediaService } from '../src/services/CharacterEncyclopediaService';
import { GameMetadataRepository } from '../src/repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../src/repositories/CharacterEncyclopediaRepository';
import { AnalysisRepository } from '../src/repositories/AnalysisRepository';
import { VectorRepository } from '../src/repositories/VectorRepository';

async function saveAnalysis() {
    try {
        const args = process.argv.slice(2);
        if (args.length < 2) {
            throw new Error('Usage: npx ts-node save_video_analysis.ts <job_id> <path_to_json_result>');
        }

        const jobId = args[0];
        const jsonPath = args[1];

        const analysisData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        await Database.connect();

        const job = await IngestionJob.findOne({ job_id: jobId });
        if (!job) {
            throw new Error(`Ingestion job not found: ${jobId}`);
        }

        const analysisId = UuidHelper.generate();

        // 1. Create Analysis record
        await Analysis.create({
            analysis_id: analysisId,
            youtube_url: job.youtube_url,
            video_source: 'youtube',
            game_id: job.game_id || 'sf6',
            analysis: analysisData,
            p1_name: analysisData.p1_name || job.p1_name,
            p2_name: analysisData.p2_name || job.p2_name,
            ai_usage: { records: [{ stage: 'chat_ide', model: 'gemini-3.1-pro', total_tokens: 0, prompt_tokens: 0, candidates_tokens: 0 }], total_tokens: 0 },
            view_count: 0,
            click_count: 0
        });

        // 2. Process Vector Intelligence (generates embeddings via Gemini and saves scenarios)
        console.log('Processing Vector Intelligence...');
        
        const gameMetadataRepo          = new GameMetadataRepository();
        const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
        const analysisRepo              = new AnalysisRepository();
        const vectorRepo                = new VectorRepository();

        const gameMetadataService         = new GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);

        const aiService = new AiService(
            AppConfig.GEMINI_API_KEY,
            AppConfig.GEMINI_MODEL,
            gameMetadataService,
            characterEncyclopediaService,
            vectorRepo,
        );

        const analysisService = new AnalysisService(
            analysisRepo,
            aiService,
            gameMetadataService,
            characterEncyclopediaService,
            undefined, // no notificationService needed here
            vectorRepo,
        );

        await analysisService.processVectorIntelligence(
            analysisId,
            { game_id: job.game_id, youtube_url: job.youtube_url },
            analysisData
        );

        // 3. Update Job
        job.status = 'completed';
        job.analysis_id = analysisId;
        job.processed_at = new Date();
        job.scenario_count = analysisData.timeline?.length || 0;
        await job.save();

        console.log(JSON.stringify({
            success: true,
            job_id: jobId,
            analysis_id: analysisId,
            message: 'Analysis saved, vector intelligence processed, and job marked as completed.'
        }, null, 2));

        process.exit(0);
    } catch (error: any) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

saveAnalysis();
