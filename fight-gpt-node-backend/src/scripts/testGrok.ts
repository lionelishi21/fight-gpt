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
    console.log('Fetching available models from xAI...');
    try {
        const axios = require('axios');
        const res = await axios.get('https://api.x.ai/v1/models', {
            headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` }
        });
        console.log('Available Models:', res.data.data.map((m: any) => m.id));
    } catch (e: any) {
        console.error('Failed to fetch models:', e.message, e.response?.data);
    }

    console.log('\nDirectly invoking generateGrokAnalysis on AiService...');
    try {
        const result = await (aiService as any).generateGrokAnalysis({
            game_id: 'sf6',
            match_format: '1v1',
            p1_character_id: 'Ryu',
            p2_character_id: 'Ken',
            video_title: 'Daigo (Ryu) vs Tokido (Ken) SF6 Match'
        });
        console.log('Result from Grok:');
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error('Failed to run Grok analysis:', e.message);
        if (e.response) {
            console.error('Response status:', e.response.status);
            console.error('Response data:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

run();
