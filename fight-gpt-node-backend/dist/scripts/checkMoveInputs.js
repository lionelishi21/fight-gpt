"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_js_1 = require("../config/database.js");
const CharacterEncyclopedia_js_1 = require("../models/CharacterEncyclopedia.js");
dotenv_1.default.config();
async function checkMoveInputs() {
    try {
        await database_js_1.Database.connect();
        const ryu = await CharacterEncyclopedia_js_1.CharacterEncyclopedia.findOne({
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
        await database_js_1.Database.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkMoveInputs();
//# sourceMappingURL=checkMoveInputs.js.map