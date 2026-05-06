import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { Game } from '../models/Game';
import { Logger } from '../helpers/logger';

async function listGames() {
    try {
        await Database.connect();
        const games = await Game.find({}).lean().exec();
        
        console.log(`--- REGISTERED GAMES (${games.length}) ---`);
        games.forEach(g => {
            console.log(`[${g.is_active ? 'ACTIVE' : 'SOON'}] ${g.name} (${g.game_id}) - ${g.publisher}`);
        });
        
        process.exit(0);
    } catch (e) {
        Logger.error('List Games Failed:', e);
        process.exit(1);
    }
}

listGames();
