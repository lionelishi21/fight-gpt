/**
 * One-shot script: populate Character.aliases for all known characters.
 * Run: npx ts-node src/scripts/seedAliases.ts
 *
 * Safe to re-run — only patches characters whose aliases array is empty.
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Character } from '../models/Character';

const ALIASES: Record<string, string[]> = {
    // SF6
    'Ryu':          ['ryu'],
    'Ken':          ['ken'],
    'Chun-Li':      ['chun-li', 'chunli', 'chun_li'],
    'Guile':        ['guile'],
    'Cammy':        ['cammy'],
    'Juri':         ['juri'],
    'Blanka':       ['blanka'],
    'Dhalsim':      ['dhalsim'],
    'E. Honda':     ['e_honda', 'honda', 'e.honda'],
    'Dee Jay':      ['dee_jay', 'deejay', 'dee jay'],
    'Manon':        ['manon'],
    'Marisa':       ['marisa'],
    'Lily':         ['lily'],
    'JP':           ['jp'],
    'Kimberly':     ['kimberly'],
    'Luke':         ['luke'],
    'Jamie':        ['jamie'],
    'Zangief':      ['zangief'],
    'M. Bison':     ['m_bison', 'bison', 'm.bison'],
    'C. Viper':     ['c_viper', 'cviper', 'c.viper'],
    'Rashid':       ['rashid'],
    'AKI':          ['aki'],
    'Ed':           ['ed'],
    'Akuma':        ['akuma'],
    'Terry':        ['terry'],
    'Mai':          ['mai'],
    'Elena':        ['elena'],
    'Sagat':        ['sagat'],
    // Tekken 8
    'Jin Kazama':           ['jin', 'jin_kazama'],
    'Kazuya Mishima':       ['kazuya', 'kazuya_mishima'],
    'Paul Phoenix':         ['paul', 'paul_phoenix'],
    'Marshall Law':         ['law', 'marshall_law'],
    'King':                 ['king'],
    'Asuka Kazama':         ['asuka', 'asuka_kazama'],
    'Nina Williams':        ['nina', 'nina_williams'],
    'Hwoarang':             ['hwoarang'],
    'Sergei Dragunov':      ['dragunov', 'sergei_dragunov'],
    'Reina':                ['reina'],
    'Jack-8':               ['jack', 'jack_8', 'jack8'],
    'Steve Fox':            ['steve', 'steve_fox'],
    'Lars Alexandersson':   ['lars', 'lars_alexandersson'],
    'Yoshimitsu':           ['yoshimitsu'],
    'Jun Kazama':           ['jun', 'jun_kazama'],
    'Eddy Gordo':           ['eddy', 'eddy_gordo'],
    'Lidia Sobieska':       ['lidia', 'lidia_sobieska'],
    'Heihachi Mishima':     ['heihachi', 'heihachi_mishima'],
    'Clive Rosfield':       ['clive', 'clive_rosfield'],
    'Leo Kliesen':          ['leo'],
    'Feng Wei':             ['feng', 'feng_wei'],
    'Lili':                 ['lili'],
    'Xiaoyu':               ['xiaoyu', 'ling_xiaoyu'],
    'Shaheen':              ['shaheen'],
    'Alisa Bosconovitch':   ['alisa', 'alisa_bosconovitch'],
    'Bryan Fury':           ['bryan', 'bryan_fury'],
    'Devil Jin':            ['devil_jin', 'deviljin'],
    'Victor Chevalier':     ['victor', 'victor_chevalier'],
    'Raven':                ['raven'],
    'Lee Chaolan':          ['lee', 'lee_chaolan'],
    'Azucena':              ['azucena'],
    'Jack-7':               ['jack7', 'jack_7'],
};

async function main() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    let updated = 0;
    let skipped = 0;

    for (const [name, aliases] of Object.entries(ALIASES)) {
        const result = await Character.updateMany(
            { name, aliases: { $size: 0 } },    // only patch if empty
            { $set: { aliases } }
        );
        if (result.modifiedCount > 0) {
            console.log(`  ✓ ${name} → [${aliases.join(', ')}] (${result.modifiedCount} docs)`);
            updated += result.modifiedCount;
        } else {
            skipped++;
        }
    }

    console.log(`\nDone: ${updated} characters updated, ${skipped} already had aliases or not found`);
    await mongoose.disconnect();
}

main().catch(console.error);
