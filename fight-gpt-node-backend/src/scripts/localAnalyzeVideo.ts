import dotenv from 'dotenv';
dotenv.config();

import { AppConfig } from '../config/app';
import { Database } from '../config/database';
import { AiService } from '../services/AiService';
import { AnalysisService } from '../services/AnalysisService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { VectorRepository } from '../repositories/VectorRepository';
import path from 'path';

async function runLocalAnalysis() {
    console.log('--- Starting Local Video Analysis ---');

    // 1. Validate Config
    AppConfig.validate();

    // 2. Connect to Database (Required to save scenarios to Vector Search)
    await Database.connect();
    console.log('✅ Connected to MongoDB');

    // 3. Initialize Repositories and Services
    const gameMetadataRepo = new GameMetadataRepository();
    const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
    const analysisRepo = new AnalysisRepository();
    const vectorRepo = new VectorRepository();

    const gameMetadataService = new GameMetadataService(gameMetadataRepo);
    const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);

    console.log('⚙️ Initializing AI Service...');
    const aiService = new AiService(
        AppConfig.GEMINI_API_KEY,
        AppConfig.GEMINI_MODEL,
        gameMetadataService,
        characterEncyclopediaService
    );

    console.log('⚙️ Initializing Analysis Service...');
    const analysisService = new AnalysisService(
        analysisRepo,
        aiService,
        gameMetadataService,
        characterEncyclopediaService,
        undefined, // No CharacterService needed for basic name lookup fallback
        vectorRepo
    );

    const inputArg = process.argv[2];
    if (!inputArg) {
        console.error('❌ Please provide a local filename or YouTube URL as an argument.');
        console.error('Example: npx ts-node src/scripts/localAnalyzeVideo.ts "https://www.youtube.com/watch?v=..."');
        process.exit(1);
    }

    let videoPath = undefined;
    let youtubeUrl = undefined;
    const isUrl = inputArg.startsWith('http://') || inputArg.startsWith('https://');

    if (isUrl) {
        youtubeUrl = inputArg;
        console.log(`\nAnalyzing YouTube video: ${youtubeUrl}`);
    } else {
        const fs = require('fs');
        videoPath = path.resolve(__dirname, '../../uploads', inputArg);
        if (!fs.existsSync(videoPath)) {
            console.error(`❌ File not found at ${videoPath}`);
            process.exit(1);
        }
        console.log(`\nAnalyzing local video: ${videoPath}`);
    }

    const request = {
        video_path: videoPath,
        youtube_url: youtubeUrl,
        game_id: 'sf6', // Testing with SF6
        p1_character_id: 'Ryu',
        p2_character_id: 'Ken'
    };

    try {
        // 5. Run the Analysis
        console.log('⏳ Uploading to Gemini and waiting for analysis (this may take a minute++)...');
        const result = await analysisService.analyzeVideo(request);

        if (result.success) {
            console.log('\n✅ Analysis Complete!');
            console.log('Match Winner:', result.data?.match_winner);
            console.log('\n--- Timeline Events Saved to Vector DB ---');

            if (result.data?.timeline && result.data.timeline.length > 0) {
                result.data.timeline.forEach((event: any, index: number) => {
                    console.log(`[Event ${index + 1}] | ${event.event_type} | ${event.timestamp}`);
                    console.log(`Situation: ${event.description}`);
                    console.log(`Advice: ${event.coach_advice}\n`);
                });
                console.log(`Saved ${result.data.timeline.length} scenarios to Vector Storage successfully.`);
            } else {
                console.log('No timeline events found to save.');
            }
        } else {
            console.error('\n❌ Analysis Failed:');
            console.error(result.error);
        }
    } catch (error) {
        console.error('\n❌ Unexpected Error During Analysis:', error);
    } finally {
        // Cleanup
        await Database.disconnect();
        console.log('\nDatabase disconnected. Exiting.');
        process.exit(0);
    }
}

// Execute the async script
runLocalAnalysis();
