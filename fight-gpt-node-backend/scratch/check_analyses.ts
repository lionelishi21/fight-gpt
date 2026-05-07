import { Database } from '../src/config/database';
import { Analysis } from '../src/models/Analysis';
import dotenv from 'dotenv';

dotenv.config();

async function checkAnalyses() {
    try {
        await Database.connect();
        const analyses = await Analysis.find().select('game_id created_at').lean();
        const gameCounts: Record<string, number> = {};
        analyses.forEach((a: any) => {
            gameCounts[a.game_id] = (gameCounts[a.game_id] || 0) + 1;
        });
        console.log('Analyses by Game:', gameCounts);
        console.log('Latest Analyses:', analyses.slice(-5).map((a: any) => ({ game: a.game_id, date: a.created_at })));
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

checkAnalyses();
