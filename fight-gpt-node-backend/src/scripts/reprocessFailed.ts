import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import mongoose from 'mongoose';
import { Analysis } from '../models/Analysis';
import { SystemSettings } from '../models/SystemSettings';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { AiService } from '../services/AiService';
import { AnalysisService } from '../services/AnalysisService';
import { AdminService } from '../services/AdminService';

async function main() {
    try {
        await Database.connect();
        console.log('✅ Connected to Database');

        // Check settings
        const settings = await SystemSettings.getSettings();
        console.log(`Active AI Provider in settings: ${settings.active_ai_provider}`);

        // Set active provider back to gemini for local test if needed (Gemini key has quota on developer environments)
        if (settings.active_ai_provider !== 'gemini') {
            console.log('Setting active AI provider to gemini for local test execution...');
            settings.active_ai_provider = 'gemini';
            await settings.save();
        }

        // Find failed analyses (characters are undefined)
        const analyses = await Analysis.find({
            $or: [
                { 'analysis.p1_character': { $in: [null, undefined, 'undefined'] } },
                { 'analysis.p2_character': { $in: [null, undefined, 'undefined'] } }
            ]
        }).lean();

        console.log(`Found ${analyses.length} analyses with undefined characters:`);
        analyses.forEach((a: any, i: number) => {
            console.log(`${i+1}. ID: ${a.analysis_id}`);
            console.log(`   URL: ${a.youtube_url}`);
            console.log(`   Winner: ${a.analysis?.match_winner}`);
            console.log(`   Title: ${a.analysis?.game_title || 'No title'}`);
        });

        if (analyses.length === 0) {
            console.log('No analyses need reprocessing.');
            await Database.disconnect();
            return;
        }

        // Initialize services to run re-analysis
        const gameMetadataRepo = new GameMetadataRepository();
        const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
        const analysisRepo = new AnalysisRepository();

        const gameMetadataService = new GameMetadataService(gameMetadataRepo);
        const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);

        const aiService = new AiService(
            process.env.GEMINI_API_KEY || 'fake',
            process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            gameMetadataService,
            characterEncyclopediaService
        );

        const analysisService = new AnalysisService(
            analysisRepo,
            aiService,
            gameMetadataService,
            characterEncyclopediaService
        );

        const IngestionJob = mongoose.connection.model('IngestionJob', new mongoose.Schema({}, { strict: false }));

        console.log('\nStarting reprocessing of failed analyses...');
        for (const a of analyses) {
            console.log(`\n-----------------------------------------`);
            console.log(`Reprocessing analysis ID: ${a.analysis_id}`);
            console.log(`URL: ${a.youtube_url}`);
            
            // Find the job to get the title
            const job = await IngestionJob.findOne({ youtube_url: a.youtube_url }).lean();
            let videoTitle = job ? (job as any).video_title : undefined;
            
            // Fetch dynamically using YouTube API if not present in DB
            if (!videoTitle && a.youtube_url) {
                console.log('Video title not in DB. Fetching from YouTube Data API...');
                try {
                    const apiKey = process.env.YOUTUBE_API_KEY;
                    const match = a.youtube_url.match(/(?:v=|\/embed\/|youtu\.be\/|v\/)([^?&"'>#]+)/);
                    const videoId = match ? match[1] : null;

                    if (videoId && apiKey) {
                        const axios = require('axios');
                        const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                            params: {
                                part: 'snippet',
                                id: videoId,
                                key: apiKey
                            },
                            timeout: 5000
                        });
                        const items = res.data?.items;
                        if (items && items.length > 0) {
                            videoTitle = items[0].snippet?.title;
                        }
                    }
                } catch (err: any) {
                    console.warn('Failed to fetch YouTube title via API:', err.message);
                }
            }

            console.log(`Resolved video title: "${videoTitle}"`);

            const result = await analysisService.analyzeVideo({
                youtube_url: a.youtube_url,
                game_id: a.game_id,
                force: true,
                analysis_id: a.analysis_id,
                video_title: videoTitle
            });

            if (result.success) {
                console.log(`✅ Reprocessed successfully!`);
                console.log(`   New P1 character: ${result.data?.p1_character}`);
                console.log(`   New P2 character: ${result.data?.p2_character}`);
                console.log(`   New P1 name: ${result.data?.p1_name}`);
                console.log(`   New P2 name: ${result.data?.p2_name}`);
                console.log(`   Timeline events count: ${result.data?.timeline?.length || 0}`);
            } else {
                console.error(`❌ Reprocessing failed: ${result.error}`);
            }
        }

        await Database.disconnect();
        console.log('\nDone.');
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
