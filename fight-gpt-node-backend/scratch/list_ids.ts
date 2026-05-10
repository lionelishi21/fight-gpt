import { Database } from '../src/config/database';
import { Analysis } from '../src/models/Analysis';
import dotenv from 'dotenv';

dotenv.config();

async function listAllIds() {
    try {
        await Database.connect();
        const analyses = await Analysis.find().sort({ created_at: -1 }).limit(20).select('analysis_id youtube_url p1_name p2_name').lean();
        analyses.forEach((a: any) => {
            console.log(`ID: ${a.analysis_id} | URL: ${a.youtube_url} | ${a.p1_name} vs ${a.p2_name}`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

listAllIds();
