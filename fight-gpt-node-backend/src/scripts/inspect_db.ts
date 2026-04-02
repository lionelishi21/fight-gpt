import dotenv from 'dotenv';
import { Database } from '../config/database';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { Logger } from '../helpers/logger';

dotenv.config();

async function inspectDb() {
    try {
        await Database.connect();

        const charName = 'Ken';
        const characterId = charName.toLowerCase();

        const encyclopedia = await CharacterEncyclopedia.findOne({
            game_id: 'sf6',
            character_id: characterId,
            is_current_patch: true,
        });

        if (!encyclopedia) {
            console.log(`No encyclopedia found for ${charName}`);
        } else {
            console.log(`--- ${charName} Data ---`);
            console.log(`Normals: ${encyclopedia.moveset.normals.length}`);
            console.log(`Specials: ${encyclopedia.moveset.specials.length}`);
            console.log(`Ex Moves: ${encyclopedia.moveset.ex_moves.length}`);
            console.log(`Supers: ${encyclopedia.moveset.supers.length}`);
            console.log(`Combos: ${encyclopedia.combos ? encyclopedia.combos.length : 0}`);

            if (encyclopedia.moveset.specials.length > 0) {
                console.log('Sample Special:', JSON.stringify(encyclopedia.moveset.specials[0], null, 2));
            }
            if (encyclopedia.combos && encyclopedia.combos.length > 0) {
                console.log('Sample Combo:', JSON.stringify(encyclopedia.combos[0], null, 2));
            }
        }

        await Database.disconnect();
    } catch (error) {
        console.error(error);
    }
}

inspectDb();
