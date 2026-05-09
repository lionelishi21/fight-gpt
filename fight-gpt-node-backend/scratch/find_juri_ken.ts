import { Database } from '../src/config/database';
import { Analysis } from '../src/models/Analysis';
import dotenv from 'dotenv';

dotenv.config();

async function findJuriKenMatches() {
    try {
        await Database.connect();
        const matches = await Analysis.find({
            $or: [
                { p1_name: /juri/i, p2_name: /ken/i },
                { p1_name: /ken/i, p2_name: /juri/i },
                { 'analysis.p1_character': /juri/i, 'analysis.p2_character': /ken/i },
                { 'analysis.p1_character': /ken/i, 'analysis.p2_character': /juri/i }
            ]
        }).lean();

        console.log(`Found ${matches.length} matches:`);
        matches.forEach((m: any) => {
            console.log(`ID: ${m.analysis_id} | URL: ${m.youtube_url} | ${m.p1_name} vs ${m.p2_name}`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

findJuriKenMatches();
