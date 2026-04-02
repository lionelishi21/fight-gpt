import dotenv from 'dotenv';
import { Database } from '../config/database.js';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia.js';

dotenv.config();

async function checkMoveInputs() {
    try {
        await Database.connect();

        const ryu = await CharacterEncyclopedia.findOne({
            character_id: 'ryu',
            is_current_patch: true
        });

        console.log('Ryu moveset check:');
        console.log('Normals count:', ryu?.moveset?.normals?.length || 0);
        console.log('Specials count:', ryu?.moveset?.specials?.length || 0);

        if (ryu?.moveset?.normals?.[0]) {
            console.log('\nFirst normal move:');
            console.log(JSON.stringify(ryu.moveset.normals[0], null, 2));
        }

        if (ryu?.moveset?.specials?.[0]) {
            console.log('\nFirst special move:');
            console.log(JSON.stringify(ryu.moveset.specials[0], null, 2));
        }

        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkMoveInputs();
