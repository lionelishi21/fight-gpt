/**
 * Tekken 8 Seeder (v2)
 * Upgrades existing T8 data to add aliases, encyclopedia stubs, and search strategies.
 * Uses upsert for all operations — safe to re-run.
 */

import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { GameSearchStrategy } from '../models/GameSearchStrategy';
import { IngestionService } from '../services/IngestionService';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { GameSearchStrategyRepository } from '../repositories/GameSearchStrategyRepository';
import { Logger } from '../helpers/logger';

const VERSION = '1.07';

const GAME = {
    game_id: 'tekken8',
    name: 'Tekken 8',
    full_name: 'Tekken 8',
    publisher: 'Bandai Namco',
    developer: 'Bandai Namco Studios',
    release_date: new Date('2024-01-26'),
    genre: 'Fighting',
    platform: ['PS5', 'Xbox Series X', 'PC'],
    is_active: true,
    latest_version: VERSION,
};

const SEARCH_QUERIES = [
    'Tekken 8 EVO 2024 top 8',
    'Tekken 8 CEO 2024 grand finals',
    'Tekken 8 high level ranked match 2024',
    'Tekken 8 Heat system combo guide 2024',
    'Tekken 8 tournament grand finals 2024',
    'Tekken 8 patch notes breakdown 2024',
    'Tekken 8 season 2 gameplay',
];

// name → [aliases], archetype, difficulty, description
const CHARACTERS: Array<{
    name: string;
    aliases: string[];
    archetype: string;
    difficulty: number;
    description: string;
}> = [
    { name: 'Jin Kazama',          aliases: ['jin', 'jin_kazama'],                        archetype: 'All-Rounder',  difficulty: 2, description: 'Jin wields both Mishima Karate and Traditional Karate — the most balanced character in T8.' },
    { name: 'Kazuya Mishima',      aliases: ['kazuya', 'kazuya_mishima'],                 archetype: 'Technical',    difficulty: 5, description: 'EWGF execution is the ceiling — Kazuya rewards mastery like no other character in T8.' },
    { name: 'Paul Phoenix',        aliases: ['paul', 'paul_phoenix'],                     archetype: 'Hard-Hitter',  difficulty: 1, description: 'Highest single-hit damage in Tekken 8. Deathfist punishes everything.' },
    { name: 'Nina Williams',       aliases: ['nina', 'nina_williams'],                    archetype: 'Rushdown',     difficulty: 4, description: 'Deepest throw mixup game in T8 with 11+ throw branches.' },
    { name: 'Sergei Dragunov',     aliases: ['dragunov', 'sergei', 'sergei_dragunov'],    archetype: 'All-Rounder',  difficulty: 3, description: 'Highest consistent damage in T8 with an elite punish game.' },
    { name: 'Hwoarang',            aliases: ['hwoarang'],                                 archetype: 'Rushdown',     difficulty: 5, description: 'Transitions between four stances using overwhelming kick combinations.' },
    { name: 'Reina',               aliases: ['reina'],                                    archetype: 'Technical',    difficulty: 4, description: 'Mishima wavedash fundamentals combined with unique Sentai and Raijin stances.' },
    { name: 'King',                aliases: ['king'],                                     archetype: 'Grappler',     difficulty: 2, description: 'Premier grappler in T8 — multi-chain throws and massive damage on hit.' },
    { name: 'Jack-8',              aliases: ['jack8', 'jack_8'],                          archetype: 'Powerhouse',   difficulty: 2, description: 'Massive wall damage with slow but devastating power moves.' },
    { name: 'Steve Fox',           aliases: ['steve', 'steve_fox'],                       archetype: 'Technical',    difficulty: 4, description: 'No kicks — entire game relies on precise punch combinations and stance mix.' },
    { name: 'Lars Alexandersson',  aliases: ['lars', 'lars_alexandersson'],               archetype: 'Rushdown',     difficulty: 3, description: 'Chain throw setups with a flexible stance for aggressive corner carry.' },
    { name: 'Asuka Kazama',        aliases: ['asuka', 'asuka_kazama'],                    archetype: 'Counter-Hit',  difficulty: 2, description: 'Shuts down aggression with Parry and counter tools.' },
    { name: 'Lili',                aliases: ['lili', 'lili_de_rochefort'],                archetype: 'Technical',    difficulty: 3, description: 'Ballet-inspired movement with tricky mix-up pressure from Sudden Cross stance.' },
    { name: 'Yoshimitsu',          aliases: ['yoshimitsu', 'yoshi'],                      archetype: 'Trickster',    difficulty: 5, description: 'Stances, sword cancels, and mind games — the most unorthodox character in T8.' },
    { name: 'Jun Kazama',          aliases: ['jun', 'jun_kazama'],                        archetype: 'Counter-Hit',  difficulty: 3, description: 'Powerful Amnesia reversals and a fluid combo game anchored by her qcf motion.' },
    { name: 'Ling Xiaoyu',         aliases: ['xiaoyu', 'xiao', 'ling_xiaoyu'],           archetype: 'Evasive',      difficulty: 4, description: 'Phoenix and AOP stances give the best evasive options in T8.' },
    { name: 'Marshall Law',        aliases: ['law', 'marshall_law'],                      archetype: 'Rushdown',     difficulty: 3, description: 'Dragon Sign and fast lows make him a constant offensive threat.' },
    { name: 'Bryan Fury',          aliases: ['bryan', 'bryan_fury'],                      archetype: 'Hard-Hitter',  difficulty: 2, description: 'Strongest wall-carry in T8. Snake Edge low and Jet Upper define his threat.' },
    { name: 'Claudio Serafino',    aliases: ['claudio', 'claudio_serafino'],              archetype: 'Zoner',        difficulty: 2, description: 'Safest poke game in T8 — Starburst mode gives massive plus frames.' },
    { name: 'Lee Chaolan',         aliases: ['lee', 'lee_chaolan', 'violet'],             archetype: 'Technical',    difficulty: 4, description: 'Precise just-frame inputs unlock Mist Step and infinite pressure sequences.' },
    { name: 'Azucena',             aliases: ['azucena'],                                  archetype: 'Evasive',      difficulty: 3, description: 'Libertador stance creates unpredictable movement meets offensive mix-ups.' },
    { name: 'Raven',               aliases: ['raven'],                                    archetype: 'Evasive',      difficulty: 3, description: 'Teleports and shadow clones control space — back-turned mixups create constant fear.' },
    { name: 'Leo Kliesen',         aliases: ['leo', 'leo_kliesen'],                       archetype: 'All-Rounder',  difficulty: 2, description: 'Well-rounded with strong mids, powerful wall game, and consistent damage routes.' },
    { name: 'Alisa Bosconovitch',  aliases: ['alisa', 'alisa_bosconovitch'],              archetype: 'Zoner',        difficulty: 3, description: 'Chainsaw attachments and rocket-boot pressure to control space at mid-to-long range.' },
    { name: 'Leroy Smith',         aliases: ['leroy', 'leroy_smith'],                     archetype: 'Counter-Hit',  difficulty: 2, description: 'Wing Chun parries and cane pokes punish rushdown characters hard.' },
    { name: 'Zafina',              aliases: ['zafina'],                                   archetype: 'Trickster',    difficulty: 4, description: 'Tarantula, Mantis, and Scarecrow stances create the most unique evasion toolkit in T8.' },
    { name: 'Devil Jin',           aliases: ['devil_jin', 'dvj'],                         archetype: 'Technical',    difficulty: 5, description: 'Mishima fundamentals plus flight mode and laser attacks — highest skill ceiling in T8.' },
    { name: 'Eddy Gordo',          aliases: ['eddy', 'eddy_gordo'],                       archetype: 'Evasive',      difficulty: 2, description: "Capoeira Ginga stance makes his lows and mids hard to react to." },
    { name: 'Victor Chevalier',    aliases: ['victor', 'victor_chevalier'],               archetype: 'Rushdown',     difficulty: 3, description: 'Sword and pistol control all ranges — new character with high style.' },
    { name: 'Shaheen',             aliases: ['shaheen'],                                  archetype: 'All-Rounder',  difficulty: 2, description: 'Clean, fundamental character with great punishes and strong wall pressure.' },
    { name: 'Feng Wei',            aliases: ['feng', 'feng_wei'],                         archetype: 'All-Rounder',  difficulty: 2, description: 'Evasive b+3+4 shoulder makes him hard to challenge at mid-range.' },
    { name: 'Panda',               aliases: ['panda'],                                    archetype: 'Grappler',     difficulty: 2, description: 'Powerful grappler with deceptive reach and massive throw damage.' },
    // Season 1 DLC
    { name: 'Lidia Sobieska',      aliases: ['lidia', 'lidia_sobieska'],                  archetype: 'Technical',    difficulty: 4, description: 'Polish Karate practitioner with powerful stance transitions and crushing lows.' },
    { name: 'Heihachi Mishima',    aliases: ['heihachi', 'heihachi_mishima'],              archetype: 'Technical',    difficulty: 4, description: 'The patriarch returns — Mishima Karate at its most powerful form.' },
    { name: 'Clive Rosfield',      aliases: ['clive', 'clive_rosfield'],                  archetype: 'Rushdown',     difficulty: 3, description: 'Final Fantasy XVI guest — uses fire magic and Ifrit summon pressure.' },
];

async function seedTekken8() {
    try {
        await Database.connect();
        Logger.info('[SeedTekken8] Connected to MongoDB');

        // 1. Upsert game record with updated version
        await Game.findOneAndUpdate({ game_id: 'tekken8' }, GAME, { upsert: true, new: true });
        Logger.info('[SeedTekken8] Game upserted');

        // 2. Patch existing characters: add aliases + upsert encyclopedia stubs
        let charsPatched = 0;
        let encCreated = 0;

        for (const char of CHARACTERS) {
            const slug = char.name.toLowerCase().replace(/\s+/g, '_');

            // Add aliases to existing character (or create if missing)
            await Character.findOneAndUpdate(
                { game_id: 'tekken8', name: char.name },
                {
                    $set: {
                        aliases: char.aliases,
                        archetype: char.archetype,
                        difficulty: char.difficulty,
                        description: char.description,
                        version: VERSION,
                        is_current: true,
                    },
                    $setOnInsert: {
                        game_id: 'tekken8',
                        name: char.name,
                        stats: { walk_speed: 0, dash_frames: 0, jump_speed: 0, air_dash: false, backdash_frames: 0, throw_range: 0 },
                        moves: [],
                        status: 'released',
                    },
                },
                { upsert: true, new: true }
            );
            charsPatched++;

            // Create encyclopedia stub only if not already present
            const existingEnc = await CharacterEncyclopedia.findOne({ game_id: 'tekken8', character_id: slug });
            if (!existingEnc) {
                await CharacterEncyclopedia.create({
                    game_id: 'tekken8',
                    character_id: slug,
                    character_name: char.name,
                    patch_version: VERSION,
                    is_current_patch: true,
                    moveset: { normals: [], specials: [], ex_moves: [], supers: [] },
                    game_rules: [],
                    videos: [],
                });
                encCreated++;
            }
        }

        Logger.info(`[SeedTekken8] Characters patched: ${charsPatched}, encyclopedia stubs created: ${encCreated}`);

        // 3. Add search strategies if none exist for this game
        const existingStrategy = await GameSearchStrategy.findOne({ game_id: 'tekken8', is_active: true });
        if (!existingStrategy) {
            await GameSearchStrategy.create({
                game_id: 'tekken8',
                queries: SEARCH_QUERIES,
                patch_version: VERSION,
                is_active: true,
                priority: 0,
            });
            Logger.info('[SeedTekken8] Search strategy created');
        } else {
            Logger.info('[SeedTekken8] Search strategy already exists — skipped');
        }

        // 4. Queue initial ingestion
        try {
            const ingestionRepo = new IngestionRepository();
            const searchStrategyRepo = new GameSearchStrategyRepository();
            const ingestionService = new IngestionService(ingestionRepo, {} as any, undefined, searchStrategyRepo);
            await ingestionService.triggerIngestion('tekken8', 20);
            Logger.info('[SeedTekken8] Ingestion queued');
        } catch (e) {
            Logger.warn(`[SeedTekken8] Ingestion queue failed (non-fatal): ${e instanceof Error ? e.message : e}`);
        }

        Logger.info('[SeedTekken8] Done');
        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        Logger.error('[SeedTekken8] Failed', error);
        process.exit(1);
    }
}

seedTekken8();
