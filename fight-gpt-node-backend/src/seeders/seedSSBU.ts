/**
 * Super Smash Bros. Ultimate Seeder
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

const SSBU_PAYLOAD = {
    game_id: 'ssbu',
    name: 'Super Smash Bros. Ultimate',
    full_name: 'Super Smash Bros. Ultimate',
    publisher: 'Nintendo',
    developer: 'Sora Ltd. / Bandai Namco Studios',
    latest_version: '13.0.2',
    match_format: '1v1' as const,
    platform: ['Nintendo Switch'],
    search_queries: [
        'Super Smash Bros Ultimate EVO 2024 top 8',
        'SSBU CEO 2024 grand finals',
        'Smash Ultimate high level tournament 2024',
        'Smash Ultimate combo guide 2024',
        'SSBU ranked match high level gameplay',
        'Smash Ultimate major grand finals 2024',
        'Smash Bros Ultimate bracket top player',
    ],
    characters: [
        // Base roster — Nintendo all-stars
        { name: 'Mario',            aliases: ['mario'],                                  archetype: 'All-Rounder',  difficulty: 1 },
        { name: 'Donkey Kong',      aliases: ['donkey_kong', 'dk'],                      archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Link',             aliases: ['link'],                                   archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Samus',            aliases: ['samus'],                                  archetype: 'Zoner',        difficulty: 3 },
        { name: 'Dark Samus',       aliases: ['dark_samus'],                             archetype: 'Zoner',        difficulty: 3 },
        { name: 'Yoshi',            aliases: ['yoshi'],                                  archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Kirby',            aliases: ['kirby'],                                  archetype: 'All-Rounder',  difficulty: 1 },
        { name: 'Fox',              aliases: ['fox', 'fox_mccloud'],                     archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Pikachu',          aliases: ['pikachu', 'pika'],                        archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Luigi',            aliases: ['luigi'],                                  archetype: 'Technical',    difficulty: 3 },
        { name: 'Ness',             aliases: ['ness'],                                   archetype: 'Zoner',        difficulty: 3 },
        { name: 'Captain Falcon',   aliases: ['captain_falcon', 'falcon', 'cf'],        archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Jigglypuff',       aliases: ['jigglypuff', 'puff'],                    archetype: 'Evasive',      difficulty: 4 },
        { name: 'Peach',            aliases: ['peach'],                                  archetype: 'Technical',    difficulty: 5 },
        { name: 'Daisy',            aliases: ['daisy'],                                  archetype: 'Technical',    difficulty: 5 },
        { name: 'Bowser',           aliases: ['bowser'],                                 archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Ice Climbers',     aliases: ['ice_climbers', 'ics', 'nana', 'popo'],   archetype: 'Technical',    difficulty: 5 },
        { name: 'Sheik',            aliases: ['sheik'],                                  archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Zelda',            aliases: ['zelda'],                                  archetype: 'Zoner',        difficulty: 3 },
        { name: 'Dr. Mario',        aliases: ['dr_mario', 'doc'],                        archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Pichu',            aliases: ['pichu'],                                  archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Falco',            aliases: ['falco'],                                  archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Marth',            aliases: ['marth'],                                  archetype: 'Technical',    difficulty: 3 },
        { name: 'Lucina',           aliases: ['lucina'],                                 archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Young Link',       aliases: ['young_link', 'ylink'],                   archetype: 'Zoner',        difficulty: 3 },
        { name: 'Ganondorf',        aliases: ['ganondorf', 'ganon'],                     archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Mewtwo',           aliases: ['mewtwo'],                                 archetype: 'Zoner',        difficulty: 4 },
        { name: 'Roy',              aliases: ['roy'],                                    archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Chrom',            aliases: ['chrom'],                                  archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Mr. Game & Watch', aliases: ['game_and_watch', 'gnw', 'mr_gnw'],       archetype: 'Trickster',    difficulty: 4 },
        { name: 'Meta Knight',      aliases: ['meta_knight', 'mk'],                     archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Pit',              aliases: ['pit'],                                    archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Dark Pit',         aliases: ['dark_pit', 'dpit'],                      archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Zero Suit Samus',  aliases: ['zss', 'zero_suit_samus'],                archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Wario',            aliases: ['wario'],                                  archetype: 'Trickster',    difficulty: 3 },
        { name: 'Snake',            aliases: ['snake', 'solid_snake'],                  archetype: 'Zoner',        difficulty: 4 },
        { name: 'Ike',              aliases: ['ike'],                                    archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Pokemon Trainer',  aliases: ['pokemon_trainer', 'pkmn_trainer', 'pt'], archetype: 'Technical',    difficulty: 5 },
        { name: 'Diddy Kong',       aliases: ['diddy_kong', 'diddy'],                   archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Lucas',            aliases: ['lucas'],                                  archetype: 'Zoner',        difficulty: 3 },
        { name: 'Sonic',            aliases: ['sonic'],                                  archetype: 'Rushdown',     difficulty: 3 },
        { name: 'King Dedede',      aliases: ['king_dedede', 'dedede', 'ddd'],          archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Olimar',           aliases: ['olimar', 'alph'],                        archetype: 'Zoner',        difficulty: 5 },
        { name: 'Lucario',          aliases: ['lucario'],                                archetype: 'Technical',    difficulty: 3 },
        { name: 'R.O.B.',           aliases: ['rob', 'r_o_b'],                           archetype: 'Zoner',        difficulty: 3 },
        { name: 'Toon Link',        aliases: ['toon_link', 'tlink'],                    archetype: 'Zoner',        difficulty: 3 },
        { name: 'Wolf',             aliases: ['wolf'],                                   archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Villager',         aliases: ['villager'],                               archetype: 'Zoner',        difficulty: 4 },
        { name: 'Mega Man',         aliases: ['mega_man', 'megaman'],                   archetype: 'Zoner',        difficulty: 3 },
        { name: 'Wii Fit Trainer',  aliases: ['wii_fit_trainer', 'wft'],                archetype: 'Zoner',        difficulty: 4 },
        { name: 'Rosalina',         aliases: ['rosalina', 'rosa'],                      archetype: 'Zoner',        difficulty: 4 },
        { name: 'Little Mac',       aliases: ['little_mac', 'mac'],                     archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Greninja',         aliases: ['greninja'],                               archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Palutena',         aliases: ['palutena', 'palu'],                      archetype: 'All-Rounder',  difficulty: 2 },
        { name: 'Pac-Man',          aliases: ['pac_man', 'pacman'],                     archetype: 'Trickster',    difficulty: 4 },
        { name: 'Robin',            aliases: ['robin'],                                  archetype: 'Zoner',        difficulty: 3 },
        { name: 'Shulk',            aliases: ['shulk'],                                  archetype: 'Technical',    difficulty: 5 },
        { name: 'Bowser Jr.',       aliases: ['bowser_jr', 'bj'],                       archetype: 'Trickster',    difficulty: 4 },
        { name: 'Duck Hunt',        aliases: ['duck_hunt', 'dh', 'duck_hunt_duo'],      archetype: 'Zoner',        difficulty: 4 },
        { name: 'Ryu',              aliases: ['ryu'],                                    archetype: 'Technical',    difficulty: 4 },
        { name: 'Ken',              aliases: ['ken'],                                    archetype: 'Rushdown',     difficulty: 4 },
        { name: 'Cloud',            aliases: ['cloud', 'cloud_strife'],                 archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Corrin',           aliases: ['corrin'],                                 archetype: 'Technical',    difficulty: 3 },
        { name: 'Bayonetta',        aliases: ['bayonetta', 'bayo'],                     archetype: 'Technical',    difficulty: 5 },
        { name: 'Inkling',          aliases: ['inkling'],                                archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Ridley',           aliases: ['ridley'],                                 archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Simon',            aliases: ['simon', 'simon_belmont'],                archetype: 'Zoner',        difficulty: 3 },
        { name: 'Richter',          aliases: ['richter', 'richter_belmont'],            archetype: 'Zoner',        difficulty: 3 },
        { name: 'King K. Rool',     aliases: ['king_k_rool', 'k_rool'],                archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Isabelle',         aliases: ['isabelle'],                               archetype: 'Zoner',        difficulty: 4 },
        { name: 'Incineroar',       aliases: ['incineroar', 'incin'],                   archetype: 'Grappler',     difficulty: 3 },
        { name: 'Piranha Plant',    aliases: ['piranha_plant', 'pp'],                   archetype: 'Zoner',        difficulty: 3 },
        // Fighter Pass 1 DLC
        { name: 'Joker',            aliases: ['joker', 'ren_amamiya'],                  archetype: 'Technical',    difficulty: 4 },
        { name: 'Hero',             aliases: ['hero', 'dq_hero'],                       archetype: 'Trickster',    difficulty: 5 },
        { name: 'Banjo-Kazooie',    aliases: ['banjo', 'banjo_kazooie'],                archetype: 'All-Rounder',  difficulty: 3 },
        { name: 'Terry',            aliases: ['terry', 'terry_bogard'],                 archetype: 'Technical',    difficulty: 4 },
        { name: 'Byleth',           aliases: ['byleth'],                                 archetype: 'Technical',    difficulty: 4 },
        // Fighter Pass 2 DLC
        { name: 'Min Min',          aliases: ['min_min'],                                archetype: 'Zoner',        difficulty: 4 },
        { name: 'Steve',            aliases: ['steve', 'minecraft'],                    archetype: 'Technical',    difficulty: 5 },
        { name: 'Sephiroth',        aliases: ['sephiroth', 'seph'],                     archetype: 'Zoner',        difficulty: 3 },
        { name: 'Pyra',             aliases: ['pyra', 'pyra_mythra'],                   archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Mythra',           aliases: ['mythra'],                                 archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Kazuya',           aliases: ['kazuya', 'kazuya_mishima_smash'],        archetype: 'Technical',    difficulty: 5 },
        { name: 'Sora',             aliases: ['sora'],                                   archetype: 'Technical',    difficulty: 3 },
    ],
};

async function seedSSBU() {
    try {
        await Database.connect();
        Logger.info('[SeedSSBU] Connected to MongoDB');

        const ingestionRepo = new IngestionRepository();
        const searchStrategyRepo = new GameSearchStrategyRepository();
        const ingestionService = new IngestionService(ingestionRepo, {} as any, undefined, searchStrategyRepo);
        const onboardingService = new GameOnboardingService(ingestionService);

        Logger.info('[SeedSSBU] Running GameOnboardingService...');
        const result = await onboardingService.onboardGame(SSBU_PAYLOAD);

        if (result.data) {
            const d = result.data;
            Logger.info('[SeedSSBU] Done:');
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
        Logger.error('[SeedSSBU] Failed', error);
        process.exit(1);
    }
}

seedSSBU();
