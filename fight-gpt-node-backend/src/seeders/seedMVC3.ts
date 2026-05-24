/**
 * Ultimate Marvel vs. Capcom 3 Seeder
 * Uses GameOnboardingService — game + characters + encyclopedia stubs
 * + search strategies + initial ingestion in one pass.
 */

import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { GameOnboardingService } from '../services/GameOnboardingService';
import { IngestionService } from '../services/IngestionService';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { GameSearchStrategyRepository } from '../repositories/GameSearchStrategyRepository';
import { Logger } from '../helpers/logger';

const MVC3_PAYLOAD = {
    game_id: 'mvc3',
    name: 'Ultimate Marvel vs. Capcom 3',
    full_name: 'Ultimate Marvel vs. Capcom 3',
    publisher: 'Capcom',
    developer: 'Capcom',
    latest_version: '1.07',
    match_format: 'team_3v3' as const,
    platform: ['PS3', 'Xbox 360', 'PS4', 'PS Vita', 'PC'],
    search_queries: [
        'Ultimate Marvel vs Capcom 3 EVO top 8',
        'UMvC3 high level tournament match',
        'Marvel vs Capcom 3 combo guide',
        'UMvC3 team synergy guide',
        'Ultimate Marvel vs Capcom 3 ranked match',
        'UMvC3 assist extensions combos 2024',
        'Marvel vs Capcom 3 grand finals',
    ],
    characters: [
        // Marvel
        { name: 'Wolverine',        aliases: ['wolverine', 'wolvie'],                   archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Spider-Man',       aliases: ['spider_man', 'spidey'],                  archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Iron Man',         aliases: ['iron_man', 'ironman'],                   archetype: 'Zoner',        difficulty: 4 },
        { name: 'Captain America',  aliases: ['captain_america', 'cap'],                archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Thor',             aliases: ['thor'],                                   archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Hulk',             aliases: ['hulk'],                                   archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'She-Hulk',         aliases: ['she_hulk', 'shehulk'],                   archetype: 'Grappler',     difficulty: 3 },
        { name: 'Storm',            aliases: ['storm'],                                  archetype: 'Zoner',        difficulty: 4 },
        { name: 'X-23',             aliases: ['x23', 'x_23', 'laura'],                  archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Nova',             aliases: ['nova', 'richard_rider'],                 archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Ghost Rider',      aliases: ['ghost_rider', 'ghostrider'],             archetype: 'Zoner',        difficulty: 3 },
        { name: 'Hawkeye',          aliases: ['hawkeye', 'clint_barton'],               archetype: 'Zoner',        difficulty: 3 },
        { name: 'Doctor Strange',   aliases: ['doctor_strange', 'strange', 'dr_strange'], archetype: 'Zoner',      difficulty: 4 },
        { name: 'Taskmaster',       aliases: ['taskmaster'],                             archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Iron Fist',        aliases: ['iron_fist', 'ironfist'],                 archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Rocket Raccoon',   aliases: ['rocket_raccoon', 'rocket'],              archetype: 'Trickster',    difficulty: 5 },
        { name: 'Dormammu',         aliases: ['dormammu'],                               archetype: 'Zoner',        difficulty: 4 },
        { name: 'Deadpool',         aliases: ['deadpool'],                               archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Magneto',          aliases: ['magneto'],                                archetype: 'Rushdown',     difficulty: 5 },
        { name: 'Sentinel',         aliases: ['sentinel'],                               archetype: 'Zoner',        difficulty: 3 },
        { name: 'MODOK',            aliases: ['modok', 'm_o_d_o_k'],                    archetype: 'Zoner',        difficulty: 5 },
        { name: 'Super-Skrull',     aliases: ['super_skrull', 'skrull'],                archetype: 'All-Rounder',  difficulty: 4 },
        { name: 'Shuma-Gorath',     aliases: ['shuma_gorath', 'shuma'],                 archetype: 'Trickster',    difficulty: 5 },
        { name: 'Phoenix',          aliases: ['phoenix', 'jean_grey', 'dark_phoenix'],  archetype: 'Zoner',        difficulty: 5 },
        { name: 'Jill Valentine',   aliases: ['jill', 'jill_valentine'],                archetype: 'Rushdown',     difficulty: 4 },
        // Capcom
        { name: 'Ryu',              aliases: ['ryu'],                                    archetype: 'Balance',      difficulty: 1 },
        { name: 'Chun-Li',          aliases: ['chun_li', 'chunli'],                     archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Morrigan',         aliases: ['morrigan'],                               archetype: 'Zoner',        difficulty: 4 },
        { name: 'Dante',            aliases: ['dante'],                                  archetype: 'Technical',    difficulty: 5 },
        { name: 'Trish',            aliases: ['trish'],                                  archetype: 'Zoner',        difficulty: 3 },
        { name: 'Wesker',           aliases: ['wesker', 'albert_wesker'],                archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Akuma',            aliases: ['akuma', 'gouki'],                         archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Arthur',           aliases: ['arthur', 'ghosts_and_goblins'],          archetype: 'Zoner',        difficulty: 4 },
        { name: 'Chris Redfield',   aliases: ['chris', 'chris_redfield'],               archetype: 'Zoner',        difficulty: 3 },
        { name: 'Haggar',           aliases: ['haggar', 'mike_haggar'],                 archetype: 'Grappler',     difficulty: 2 },
        { name: 'Amaterasu',        aliases: ['amaterasu', 'ammy'],                     archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Viewtiful Joe',    aliases: ['viewtiful_joe', 'vjoe'],                 archetype: 'Technical',    difficulty: 5 },
        { name: 'Tron Bonne',       aliases: ['tron_bonne', 'tron'],                    archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Hsien-Ko',         aliases: ['hsien_ko', 'hsienco'],                   archetype: 'Trickster',    difficulty: 4 },
        { name: 'Felicia',          aliases: ['felicia'],                                archetype: 'Rushdown',     difficulty: 3 },
        { name: 'C. Viper',         aliases: ['c_viper', 'cviper', 'crimson_viper'],    archetype: 'Technical',    difficulty: 5 },
        { name: 'Zero',             aliases: ['zero'],                                   archetype: 'Rushdown',     difficulty: 5 },
        { name: 'Spencer',          aliases: ['spencer', 'nathan_spencer'],             archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Nemesis',          aliases: ['nemesis', 'nemesis_t_type'],             archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Firebrand',        aliases: ['firebrand', 'red_arremer'],              archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Phoenix Wright',   aliases: ['phoenix_wright', 'nick'],                archetype: 'Trickster',    difficulty: 5 },
        { name: 'Vergil',           aliases: ['vergil'],                                 archetype: 'Technical',    difficulty: 4 },
        { name: 'Strider Hiryu',    aliases: ['strider', 'strider_hiryu'],              archetype: 'Rushdown',     difficulty: 4 },
    ],
};

async function seedMVC3() {
    try {
        await Database.connect();
        Logger.info('[SeedMVC3] Connected to MongoDB');

        const ingestionRepo = new IngestionRepository();
        const searchStrategyRepo = new GameSearchStrategyRepository();
        const ingestionService = new IngestionService(ingestionRepo, {} as any, undefined, searchStrategyRepo);
        const onboardingService = new GameOnboardingService(ingestionService);

        Logger.info('[SeedMVC3] Running GameOnboardingService...');
        const result = await onboardingService.onboardGame(MVC3_PAYLOAD);

        if (result.data) {
            const d = result.data;
            Logger.info('[SeedMVC3] Done:');
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
        Logger.error('[SeedMVC3] Failed', error);
        process.exit(1);
    }
}

seedMVC3();
