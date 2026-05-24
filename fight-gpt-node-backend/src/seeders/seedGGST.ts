/**
 * Guilty Gear -Strive- Seeder
 * Uses GameOnboardingService to create game + characters + encyclopedia stubs
 * + search strategies + trigger initial ingestion in one pass.
 */

import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { GameOnboardingService } from '../services/GameOnboardingService';
import { IngestionService } from '../services/IngestionService';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { GameSearchStrategyRepository } from '../repositories/GameSearchStrategyRepository';
import { Logger } from '../helpers/logger';

const GGST_PAYLOAD = {
    game_id: 'ggst',
    name: 'Guilty Gear Strive',
    full_name: 'Guilty Gear -Strive-',
    publisher: 'Arc System Works',
    developer: 'Arc System Works',
    latest_version: '1.38',
    match_format: '1v1' as const,
    platform: ['PS5', 'PS4', 'PC'],
    search_queries: [
        'Guilty Gear Strive EVO 2024 top 8',
        'GGST CEO 2024 top 8',
        'Guilty Gear Strive high level ranked match 2024',
        'GGST tournament grand finals 2024',
        'Guilty Gear Strive combo guide 2024',
        'GGST patch notes breakdown 2024',
    ],
    characters: [
        // Base roster
        { name: 'Sol Badguy',           aliases: ['sol', 'sol_badguy'],             archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Ky Kiske',             aliases: ['ky', 'ky_kiske'],                archetype: 'Balance',      difficulty: 1 },
        { name: 'May',                  aliases: ['may'],                            archetype: 'Rushdown',     difficulty: 1 },
        { name: 'Axl Low',              aliases: ['axl', 'axl_low'],                archetype: 'Zoner',        difficulty: 3 },
        { name: 'Chipp Zanuff',         aliases: ['chipp', 'chipp_zanuff'],         archetype: 'Rushdown',     difficulty: 5 },
        { name: 'Potemkin',             aliases: ['potemkin', 'pot'],               archetype: 'Grappler',     difficulty: 2 },
        { name: 'Faust',                aliases: ['faust'],                          archetype: 'Trickster',    difficulty: 4 },
        { name: 'Millia Rage',          aliases: ['millia', 'millia_rage'],         archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Zato-1',               aliases: ['zato', 'zato_1', 'zato1'],       archetype: 'Puppet',       difficulty: 5 },
        { name: 'Ramlethal Valentine',  aliases: ['ramlethal', 'ram'],              archetype: 'Zoner',        difficulty: 3 },
        { name: 'Leo Whitefang',        aliases: ['leo', 'leo_whitefang'],          archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Nagoriyuki',           aliases: ['nagoriyuki', 'nago'],            archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Giovanna',             aliases: ['giovanna', 'gio'],               archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Anji Mito',            aliases: ['anji', 'anji_mito'],             archetype: 'Balance',      difficulty: 3 },
        { name: 'I-No',                 aliases: ['ino', 'i_no'],                   archetype: 'Rushdown',     difficulty: 4 },
        // Season 1 DLC
        { name: 'Goldlewis Dickinson',  aliases: ['goldlewis', 'gold'],             archetype: 'Powerhouse',   difficulty: 3 },
        { name: 'Jack-O',               aliases: ['jacko', 'jack_o'],               archetype: 'Puppet',       difficulty: 4 },
        { name: 'Happy Chaos',          aliases: ['happy_chaos', 'hc', 'chaos'],    archetype: 'Zoner',        difficulty: 5 },
        // Season 2 DLC
        { name: 'Baiken',               aliases: ['baiken'],                         archetype: 'Counter-Hit',  difficulty: 3 },
        { name: 'Testament',            aliases: ['testament'],                      archetype: 'Zoner',        difficulty: 3 },
        { name: 'Bridget',              aliases: ['bridget'],                        archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Sin Kiske',            aliases: ['sin', 'sin_kiske'],              archetype: 'Rushdown',     difficulty: 2 },
        // Season 3 DLC
        { name: 'Bedman?',              aliases: ['bedman', 'delilah'],             archetype: 'Zoner',        difficulty: 4 },
        { name: 'Asuka R#',             aliases: ['asuka', 'asuka_r', 'the_man'],  archetype: 'Trickster',    difficulty: 5 },
        { name: 'Johnny',               aliases: ['johnny'],                         archetype: 'Technical',    difficulty: 4 },
        { name: 'Elphelt Valentine',    aliases: ['elphelt', 'elphelt_valentine'],  archetype: 'Zoner',        difficulty: 3 },
        { name: 'A.B.A',               aliases: ['aba', 'a_b_a'],                  archetype: 'Hard-Hitter',  difficulty: 4 },
        { name: 'Queen Dizzy',          aliases: ['dizzy', 'queen_dizzy'],          archetype: 'Zoner',        difficulty: 3 },
    ],
};

async function seedGGST() {
    try {
        await Database.connect();
        Logger.info('[SeedGGST] Connected to MongoDB');

        const ingestionRepo = new IngestionRepository();
        const searchStrategyRepo = new GameSearchStrategyRepository();
        const ingestionService = new IngestionService(ingestionRepo, {} as any, undefined, searchStrategyRepo);
        const onboardingService = new GameOnboardingService(ingestionService);

        Logger.info('[SeedGGST] Running GameOnboardingService...');
        const result = await onboardingService.onboardGame(GGST_PAYLOAD);

        if (result.data) {
            const d = result.data;
            Logger.info(`[SeedGGST] Done:`);
            Logger.info(`  game_created:           ${d.game_created}`);
            Logger.info(`  characters_created:     ${d.characters_created}`);
            Logger.info(`  encyclopedia_entries:   ${d.encyclopedia_entries_created}`);
            Logger.info(`  search_strategies:      ${d.search_strategies_created}`);
            Logger.info(`  ingestion_queued:       ${d.ingestion_queued}`);
            if (d.errors.length) Logger.warn(`  warnings: ${d.errors.join(', ')}`);
        }

        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        Logger.error('[SeedGGST] Failed', error);
        process.exit(1);
    }
}

seedGGST();
