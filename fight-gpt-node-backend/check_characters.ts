import { Database } from './src/config/database';
import { CharacterEncyclopedia } from './src/models/CharacterEncyclopedia';
import dotenv from 'dotenv';

dotenv.config();

async function checkCharacters() {
    await Database.connect();

    const games = ['sf6', 'tekken8', 'ggst', 'mk1'];

    for (const game of games) {
        const chars = await CharacterEncyclopedia.find(
            { game_id: game },
            { character_id: 1, patch_version: 1, _id: 0 },
        ).lean();

        if (chars.length) {
            console.log(`\n${game.toUpperCase()} (${chars.length} entries):`);
            chars.forEach(c => console.log(`  - ${c.character_id} (patch: ${c.patch_version})`));
        } else {
            console.log(`\n${game.toUpperCase()}: no data`);
        }
    }

    process.exit(0);
}

checkCharacters();
