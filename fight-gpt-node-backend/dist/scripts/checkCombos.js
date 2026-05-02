"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_js_1 = require("../config/database.js");
const CharacterEncyclopedia_js_1 = require("../models/CharacterEncyclopedia.js");
dotenv_1.default.config();
async function checkCombos() {
    try {
        await database_js_1.Database.connect();
        const ryu = await CharacterEncyclopedia_js_1.CharacterEncyclopedia.findOne({
            character_id: 'ryu',
            is_current_patch: true
        });
        console.log('Ryu combos count:', ryu?.combos?.length || 0);
        console.log('\nFirst 3 combos:');
        console.log(JSON.stringify(ryu?.combos?.slice(0, 3), null, 2));
        await database_js_1.Database.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkCombos();
//# sourceMappingURL=checkCombos.js.map