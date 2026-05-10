import { Database } from '../src/config/database';
import { Analysis } from '../src/models/Analysis';
import dotenv from 'dotenv';

dotenv.config();

async function checkSpecificAnalysis(id: string) {
    try {
        await Database.connect();
        let analysis = await Analysis.findOne({ analysis_id: id }).lean();
        if (!analysis) {
            try {
                analysis = await Analysis.findById(id).lean();
            } catch (e) {}
        }
        
        if (!analysis) {
            console.log('Analysis not found');
            return;
        }
        console.log('--- Analysis Record ---');
        console.log('ID:', analysis.analysis_id);
        console.log('YouTube URL:', analysis.youtube_url);
        console.log('Video Path:', analysis.video_path);
        console.log('Game:', analysis.game_id);
        console.log('P1 Name:', analysis.p1_name);
        console.log('P2 Name:', analysis.p2_name);
        console.log('AI Analysis characters:', {
            p1: (analysis.analysis as any)?.p1_character,
            p2: (analysis.analysis as any)?.p2_character,
            game: (analysis.analysis as any)?.game_title
        });
        console.log('Created At:', analysis.created_at);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

const id = process.argv[2] || '37cb8144-2d9d-46cf-adb9-156f2cacbbe6';
checkSpecificAnalysis(id);
