"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const CharacterEncyclopedia_1 = require("../models/CharacterEncyclopedia");
dotenv_1.default.config();
async function inspectDb() {
    try {
        await database_1.Database.connect();
        const charName = 'Ken';
        const characterId = charName.toLowerCase();
        const encyclopedia = await CharacterEncyclopedia_1.CharacterEncyclopedia.findOne({
            game_id: 'sf6',
            character_id: characterId,
            is_current_patch: true,
        });
        if (!encyclopedia) {
            console.log(`No encyclopedia found for ${charName}`);
        }
        else {
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
        await database_1.Database.disconnect();
    }
    catch (error) {
        console.error(error);
    }
}
inspectDb();
//# sourceMappingURL=inspect_db.js.map