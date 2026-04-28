import dotenv from 'dotenv';
import { Database } from '../config/database';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { TheoryDoc } from '../models/TheoryDocument';

import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
    await Database.connect();
    const name = "C.Viper";
    const slug = "c_viper";
    
    console.log(`Checking for ${name}...`);
    
    const char = await Character.findOne({ $or: [{ name: name }, { slug: slug }] });
    console.log("Character Record:", char ? "FOUND" : "MISSING");
    
    const enc = await CharacterEncyclopedia.findOne({ character_id: slug });
    console.log("Encyclopedia Entry:", enc ? "FOUND" : "MISSING");
    
    const theory = await TheoryDoc.findOne({ character_id: slug });
    console.log("Theory Document:", theory ? "FOUND" : "MISSING");
    
    await Database.disconnect();
}

check();
