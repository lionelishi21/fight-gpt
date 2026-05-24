/**
 * Dragon Ball FighterZ Seeder
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

const DBFZ_PAYLOAD = {
    game_id: 'dbfz',
    name: 'Dragon Ball FighterZ',
    full_name: 'Dragon Ball FighterZ',
    publisher: 'Bandai Namco',
    developer: 'Arc System Works',
    latest_version: '1.33',
    match_format: 'team_3v3' as const,
    platform: ['PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'PC', 'Nintendo Switch'],
    search_queries: [
        'Dragon Ball FighterZ EVO 2024 top 8',
        'DBFZ CEO 2024 grand finals',
        'Dragon Ball FighterZ high level tournament 2024',
        'DBFZ combo guide 2024',
        'Dragon Ball FighterZ ranked match high level',
        'DBFZ patch notes breakdown',
        'Dragon Ball FighterZ team composition guide',
    ],
    characters: [
        // Base roster
        { name: 'Goku (SSJ)',               aliases: ['goku', 'goku_ssj', 'ssj_goku'],                  archetype: 'Balance',      difficulty: 2 },
        { name: 'Vegeta (SSJ)',             aliases: ['vegeta', 'vegeta_ssj', 'ssj_vegeta'],             archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Gohan (Adult)',            aliases: ['gohan', 'adult_gohan'],                           archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Teen Gohan',               aliases: ['teen_gohan', 'ssj2_gohan', 'young_gohan'],        archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Piccolo',                  aliases: ['piccolo'],                                         archetype: 'Zoner',        difficulty: 2 },
        { name: 'Gotenks',                  aliases: ['gotenks'],                                         archetype: 'Trickster',    difficulty: 4 },
        { name: 'Frieza',                   aliases: ['frieza', 'freeza', 'final_frieza'],                archetype: 'Technical',    difficulty: 3 },
        { name: 'Cell',                     aliases: ['cell', 'perfect_cell'],                           archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Android 16',              aliases: ['android_16', 'a16'],                               archetype: 'Grappler',     difficulty: 2 },
        { name: 'Android 18',              aliases: ['android_18', 'a18'],                               archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Android 21',              aliases: ['android_21', 'a21'],                               archetype: 'Technical',    difficulty: 3 },
        { name: 'Majin Buu',               aliases: ['majin_buu', 'fat_buu', 'buu'],                    archetype: 'Grappler',     difficulty: 3 },
        { name: 'Krillin',                  aliases: ['krillin', 'kuririn'],                              archetype: 'Zoner',        difficulty: 3 },
        { name: 'Yamcha',                   aliases: ['yamcha'],                                          archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Trunks',                   aliases: ['trunks', 'future_trunks'],                        archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Nappa',                    aliases: ['nappa'],                                           archetype: 'Zoner',        difficulty: 2 },
        { name: 'Captain Ginyu',           aliases: ['ginyu', 'captain_ginyu'],                          archetype: 'Trickster',    difficulty: 5 },
        { name: 'Broly (DBZ)',             aliases: ['broly', 'broly_dbz', 'lssj_broly'],               archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Hit',                      aliases: ['hit'],                                             archetype: 'Technical',    difficulty: 3 },
        { name: 'Goku Black',              aliases: ['goku_black', 'black', 'black_goku'],              archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Kid Buu',                 aliases: ['kid_buu'],                                         archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Beerus',                   aliases: ['beerus'],                                          archetype: 'Zoner',        difficulty: 4 },
        { name: 'Goku (SSGSS)',            aliases: ['goku_blue', 'ssgss_goku', 'blue_goku'],           archetype: 'Balance',      difficulty: 2 },
        { name: 'Vegeta (SSGSS)',          aliases: ['vegeta_blue', 'ssgss_vegeta', 'blue_vegeta'],     archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Fused Zamasu',            aliases: ['fused_zamasu', 'zamasu'],                          archetype: 'Zoner',        difficulty: 3 },
        { name: 'Vegito (SSGSS)',          aliases: ['vegito', 'vegito_blue', 'ssgss_vegito'],          archetype: 'All-Rounder',  difficulty: 3 },
        // Season 1 DLC
        { name: 'Bardock',                  aliases: ['bardock'],                                         archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Broly (DBS)',             aliases: ['broly_dbs', 'dbs_broly', 'super_broly'],          archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Vegeta (GT)',             aliases: ['gt_vegeta', 'vegeta_gt', 'ss4_vegeta'],           archetype: 'Technical',    difficulty: 4 },
        { name: 'Goku (GT)',               aliases: ['gt_goku', 'goku_gt', 'ss4_goku'],                archetype: 'Technical',    difficulty: 4 },
        { name: 'Cooler',                   aliases: ['cooler'],                                          archetype: 'All-Rounder',  difficulty: 3 },
        // Season 2 DLC
        { name: 'Jiren',                    aliases: ['jiren'],                                           archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Videl',                    aliases: ['videl'],                                           archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Goku (Base)',             aliases: ['base_goku', 'goku_base'],                          archetype: 'Balance',      difficulty: 2 },
        { name: 'Vegeta (Base)',           aliases: ['base_vegeta', 'vegeta_base'],                      archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Janemba',                  aliases: ['janemba'],                                         archetype: 'Trickster',    difficulty: 4 },
        { name: 'Gogeta (SSGSS)',          aliases: ['gogeta', 'gogeta_blue', 'ssgss_gogeta'],          archetype: 'Rushdown',     difficulty: 3 },
        // Season 3 DLC
        { name: 'Kefla',                    aliases: ['kefla'],                                           archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Goku (UI)',               aliases: ['ui_goku', 'ultra_instinct', 'goku_ui'],           archetype: 'Technical',    difficulty: 5 },
        { name: 'Master Roshi',            aliases: ['master_roshi', 'roshi'],                           archetype: 'Zoner',        difficulty: 4 },
        { name: 'Super Baby 2',            aliases: ['baby_vegeta', 'super_baby_2', 'baby'],            archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'SS4 Gogeta',              aliases: ['ss4_gogeta', 'gogeta_ss4'],                        archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Android 21 (Lab Coat)',   aliases: ['android_21_lab', 'lab_21', 'evil_21'],            archetype: 'Technical',    difficulty: 4 },
    ],
};

async function seedDBFZ() {
    try {
        await Database.connect();
        Logger.info('[SeedDBFZ] Connected to MongoDB');

        const ingestionRepo = new IngestionRepository();
        const searchStrategyRepo = new GameSearchStrategyRepository();
        const ingestionService = new IngestionService(ingestionRepo, {} as any, undefined, searchStrategyRepo);
        const onboardingService = new GameOnboardingService(ingestionService);

        Logger.info('[SeedDBFZ] Running GameOnboardingService...');
        const result = await onboardingService.onboardGame(DBFZ_PAYLOAD);

        if (result.data) {
            const d = result.data;
            Logger.info('[SeedDBFZ] Done:');
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
        Logger.error('[SeedDBFZ] Failed', error);
        process.exit(1);
    }
}

seedDBFZ();
