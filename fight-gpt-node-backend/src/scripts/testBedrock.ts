import dotenv from 'dotenv';
dotenv.config();

import { AiService } from '../services/AiService';

const mockGameMetadataService = {
    getCurrentGameMetadataByGameId: async () => ({ success: true, data: null })
} as any;

const mockCharacterService = {
    getGameRules: async () => ({ success: true, data: [] })
} as any;

const aiService = new AiService(
    process.env.GEMINI_API_KEY || 'fake',
    'gemini-2.5-flash',
    mockGameMetadataService,
    mockCharacterService
);

async function run() {
    console.log('Directly invoking generateBedrockAnalysis on AiService...');
    try {
        const result = await (aiService as any).generateBedrockAnalysis({
            game_id: 'sf6',
            match_format: '1v1',
            p1_character_id: 'Ryu',
            p2_character_id: 'Ken',
            video_title: 'Daigo (Ryu) vs Tokido (Ken) SF6 Match'
        });
        console.log('\n--- SUCCESS ---');
        console.log('Result from Bedrock:');
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error('\n--- FAILED ---');
        console.error('Failed to run Bedrock analysis:', e.message);
        if (e.stack) console.error(e.stack);
    }
}

run();
