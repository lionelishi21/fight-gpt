import dotenv from 'dotenv';
import path from 'path';
import { Database } from '../config/database';
import { Game } from '../models/Game';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await Database.connect();
    console.log("Fetching games...");
    const games = await Game.find();
    console.log("Games found:", games.length);
    games.forEach(g => {
        console.log(`- ${g.name} (${g.game_id})`);
    });
    await Database.disconnect();
}

check();
