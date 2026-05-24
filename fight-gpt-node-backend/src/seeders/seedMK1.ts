/**
 * Mortal Kombat 1 Seeder
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

const MK1_PAYLOAD = {
    game_id: 'mk1',
    name: 'Mortal Kombat 1',
    full_name: 'Mortal Kombat 1',
    publisher: 'Warner Bros. Games',
    developer: 'NetherRealm Studios',
    latest_version: '1.0.9',
    match_format: '1v1' as const,
    platform: ['PS5', 'Xbox Series X', 'PC', 'Nintendo Switch'],
    search_queries: [
        'Mortal Kombat 1 EVO 2024 top 8',
        'MK1 CEO 2024 grand finals',
        'Mortal Kombat 1 high level ranked match 2024',
        'MK1 tournament 2024 top players',
        'Mortal Kombat 1 combo guide 2024',
        'MK1 patch notes breakdown 2024',
        'Mortal Kombat 1 season 2 gameplay',
    ],
    characters: [
        // Base roster
        { name: 'Liu Kang',         aliases: ['liu_kang', 'liu'],               archetype: 'Balance',      difficulty: 2 },
        { name: 'Scorpion',         aliases: ['scorpion', 'hanzo'],             archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Sub-Zero',         aliases: ['sub_zero', 'subzero', 'kuai'],  archetype: 'Zoner',        difficulty: 2 },
        { name: 'Kitana',           aliases: ['kitana'],                         archetype: 'Zoner',        difficulty: 3 },
        { name: 'Mileena',          aliases: ['mileena'],                        archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Raiden',           aliases: ['raiden'],                         archetype: 'Rushdown',     difficulty: 2 },
        { name: 'Johnny Cage',      aliases: ['johnny_cage', 'johnny'],         archetype: 'Technical',    difficulty: 3 },
        { name: 'Kenshi',           aliases: ['kenshi'],                         archetype: 'Zoner',        difficulty: 3 },
        { name: 'Kung Lao',         aliases: ['kung_lao'],                       archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Shang Tsung',      aliases: ['shang_tsung', 'shang'],         archetype: 'Trickster',    difficulty: 5 },
        { name: 'Reptile',          aliases: ['reptile'],                        archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Baraka',           aliases: ['baraka'],                         archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Geras',            aliases: ['geras'],                          archetype: 'Grappler',     difficulty: 2 },
        { name: 'Sindel',           aliases: ['sindel'],                         archetype: 'Zoner',        difficulty: 3 },
        { name: 'Smoke',            aliases: ['smoke'],                          archetype: 'Evasive',      difficulty: 3 },
        { name: 'Rain',             aliases: ['rain'],                           archetype: 'Zoner',        difficulty: 4 },
        { name: 'Li Mei',           aliases: ['li_mei', 'limei'],               archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Tanya',            aliases: ['tanya'],                          archetype: 'Zoner',        difficulty: 3 },
        { name: 'Ashrah',           aliases: ['ashrah'],                         archetype: 'Zoner',        difficulty: 3 },
        { name: 'Havik',            aliases: ['havik'],                          archetype: 'Trickster',    difficulty: 4 },
        { name: 'Nitara',           aliases: ['nitara'],                         archetype: 'Rushdown',     difficulty: 3 },
        { name: 'General Shao',     aliases: ['general_shao', 'shao'],         archetype: 'Hard-Hitter',  difficulty: 2 },
        { name: 'Reiko',            aliases: ['reiko'],                          archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Cyrax',            aliases: ['cyrax'],                          archetype: 'Technical',    difficulty: 4 },
        { name: 'Sektor',           aliases: ['sektor'],                         archetype: 'Zoner',        difficulty: 4 },
        // Kombat Pack 1 DLC
        { name: 'Omni-Man',         aliases: ['omni_man', 'omniman'],           archetype: 'Hard-Hitter',  difficulty: 3 },
        { name: 'Quan Chi',         aliases: ['quan_chi', 'quanchi'],           archetype: 'Zoner',        difficulty: 4 },
        { name: 'Peacemaker',       aliases: ['peacemaker'],                     archetype: 'Zoner',        difficulty: 3 },
        { name: 'Ermac',            aliases: ['ermac'],                          archetype: 'Zoner',        difficulty: 4 },
        // Kombat Pack 2 DLC
        { name: 'Homelander',       aliases: ['homelander'],                     archetype: 'Rushdown',     difficulty: 3 },
        { name: 'Takeda',           aliases: ['takeda', 'takeda_takahashi'],    archetype: 'Zoner',        difficulty: 3 },
        { name: 'Ghostface',        aliases: ['ghostface'],                      archetype: 'Trickster',    difficulty: 3 },
        { name: 'Conan',            aliases: ['conan', 'conan_the_barbarian'],  archetype: 'Hard-Hitter',  difficulty: 2 },
    ],
};

async function seedMK1() {
    try {
        await Database.connect();
        Logger.info('[SeedMK1] Connected to MongoDB');

        const ingestionRepo = new IngestionRepository();
        const searchStrategyRepo = new GameSearchStrategyRepository();
        const ingestionService = new IngestionService(ingestionRepo, {} as any, undefined, searchStrategyRepo);
        const onboardingService = new GameOnboardingService(ingestionService);

        Logger.info('[SeedMK1] Running GameOnboardingService...');
        const result = await onboardingService.onboardGame(MK1_PAYLOAD);

        if (result.data) {
            const d = result.data;
            Logger.info(`[SeedMK1] Done:`);
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
        Logger.error('[SeedMK1] Failed', error);
        process.exit(1);
    }
}

seedMK1();
