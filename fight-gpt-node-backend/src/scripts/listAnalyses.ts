import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import mongoose from 'mongoose';
import { Logger } from '../helpers/logger';

async function listRecentAnalyses() {
    try {
        await Database.connect();
        
        // Use any to bypass type strictness for a quick script
        const Analysis = mongoose.connection.model('Analysis', new mongoose.Schema({}, { strict: false }));
        
        const recent = await Analysis.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
            .exec();

        if (recent.length === 0) {
            console.log('No analyses found in the database.');
        } else {
            console.log('--- RECENT COMPLETED ANALYSES ---');
            recent.forEach((a: any, i: number) => {
                const data = a.analysis || {};
                console.log(`${i+1}. [${a.game_id?.toUpperCase()}] ${data.game_title || 'Untitled Match'}`);
                console.log(`   Characters: ${data.p1_character} vs ${data.p2_character}`);
                console.log(`   Winner: ${data.match_winner}`);
                console.log(`   Date: ${a.createdAt}`);
                console.log(`   Link: https://metapunish.com/dashboard/matches/${a.analysis_id}`);
                console.log('--------------------------------');
            });
        }
        
        process.exit(0);
    } catch (e) {
        console.error('Failed to list analyses:', e);
        process.exit(1);
    }
}

listRecentAnalyses();
