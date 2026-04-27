import { AiService } from '../services/AiService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env');
    process.exit(1);
}

// Mock services since we just want to test the Gemini video connection
const mockGameMetadataService = {
    getCurrentGameMetadataByGameId: async () => ({ success: true, data: null })
} as any;

const mockCharacterService = {
    getGameRules: async () => ({ success: true, data: [] })
} as any;

const aiService = new AiService(
    apiKey,
    'gemini-2.5-flash',
    mockGameMetadataService,
    mockCharacterService
);

async function runTest() {
    console.log('Testing AiService.analyzeVideo directly with YouTube URL...');
    try {
        const result = await aiService.analyzeVideo({
            youtube_url: 'https://www.youtube.com/watch?v=vo-Mts-cUR0', // The URL you tried earlier
            ai_context: 'This is a test. Just return a short summary.'
        });
        
        console.log('\n--- SUCCESS ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('\n--- FAILED ---');
        console.error(error.message);
    }
}

runTest();
