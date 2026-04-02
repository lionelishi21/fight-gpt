import dotenv from 'dotenv';
import { Database } from '../config/database.js';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia.js';

dotenv.config();

async function checkCombos() {
    try {
        await Database.connect();

        const ryu = await CharacterEncyclopedia.findOne({
            character_id: 'ryu',
            is_current_patch: true
        });

        console.log('Ryu combos count:', ryu?.combos?.length || 0);
        console.log('\nFirst 3 combos:');
        console.log(JSON.stringify(ryu?.combos?.slice(0, 3), null, 2));

        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCombos();
