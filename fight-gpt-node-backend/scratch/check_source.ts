import { Database } from '../src/config/database';
import { Analysis } from '../src/models/Analysis';
import dotenv from 'dotenv';

dotenv.config();

async function checkSource(id: string) {
    try {
        await Database.connect();
        const analysis = await Analysis.findOne({ analysis_id: id }).lean();
        if (!analysis) {
            console.log('Analysis not found');
            return;
        }
        console.log('Top-level youtube_url:', analysis.youtube_url);
        console.log('AI Analysis Source:', (analysis.analysis as any)?.source);
        console.log('AI Analysis Characters:', (analysis.analysis as any)?.p1_character, 'vs', (analysis.analysis as any)?.p2_character);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

const id = '37cb8144-2d9d-46cf-adb9-156f2cacbbe6';
checkSource(id);
