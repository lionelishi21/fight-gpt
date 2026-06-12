import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Game } from '../models/Game';
import { VersionResolver } from '../helpers/VersionResolver';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Derive the canonical list from VersionResolver so this script and the
// prompt system are always in sync — one source of truth.
const GAMES_FROM_REGISTRY: Array<{
    game_id: string;
    name: string;
    full_name: string;
    publisher: string;
    developer: string;
    release_year: number;
    match_format: '1v1' | 'team_3v3' | 'team_2v2' | 'team_tag';
    is_active: boolean;
    latest_version: string;
}> = [
    {
        game_id: 'sf6',
        name: 'Street Fighter 6',
        full_name: 'Street Fighter 6',
        publisher: 'Capcom',
        developer: 'Capcom',
        release_year: 2023,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'sf5',
        name: 'Street Fighter V',
        full_name: 'Street Fighter V: Champion Edition',
        publisher: 'Capcom',
        developer: 'Capcom',
        release_year: 2016,
        match_format: '1v1',
        is_active: true,
        latest_version: 'CE',
    },
    {
        game_id: 'tekken8',
        name: 'Tekken 8',
        full_name: 'Tekken 8',
        publisher: 'Bandai Namco',
        developer: 'Bandai Namco',
        release_year: 2024,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'tekken7',
        name: 'Tekken 7',
        full_name: 'Tekken 7: Fated Retribution',
        publisher: 'Bandai Namco',
        developer: 'Bandai Namco',
        release_year: 2015,
        match_format: '1v1',
        is_active: true,
        latest_version: '4.0',
    },
    {
        game_id: 'ggst',
        name: 'Guilty Gear Strive',
        full_name: 'Guilty Gear -Strive-',
        publisher: 'Arc System Works',
        developer: 'Arc System Works',
        release_year: 2021,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'mk1',
        name: 'Mortal Kombat 1',
        full_name: 'Mortal Kombat 1',
        publisher: 'Warner Bros. Games',
        developer: 'NetherRealm Studios',
        release_year: 2023,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'dbfz',
        name: 'Dragon Ball FighterZ',
        full_name: 'Dragon Ball FighterZ',
        publisher: 'Bandai Namco',
        developer: 'Arc System Works',
        release_year: 2018,
        match_format: 'team_3v3',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'umvc3',
        name: 'Ultimate Marvel vs Capcom 3',
        full_name: 'Ultimate Marvel vs. Capcom 3',
        publisher: 'Capcom',
        developer: 'Capcom',
        release_year: 2011,
        match_format: 'team_3v3',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'kofxv',
        name: 'King of Fighters XV',
        full_name: 'The King of Fighters XV',
        publisher: 'SNK',
        developer: 'SNK',
        release_year: 2022,
        match_format: '1v1',
        is_active: true,
        latest_version: '2.0',
    },
    {
        game_id: 'kof2002',
        name: 'KOF 2002 Unlimited Match',
        full_name: 'The King of Fighters 2002 Unlimited Match',
        publisher: 'SNK',
        developer: 'SNK',
        release_year: 2009,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'gbvsr',
        name: 'Granblue Fantasy Versus: Rising',
        full_name: 'Granblue Fantasy Versus: Rising',
        publisher: 'Cygames',
        developer: 'Arc System Works',
        release_year: 2023,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'unib',
        name: 'Under Night In-Birth II',
        full_name: 'Under Night In-Birth II Sys:Celes',
        publisher: 'Arc System Works',
        developer: 'French-Bread',
        release_year: 2023,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'bbcf',
        name: 'BlazBlue Centralfiction',
        full_name: 'BlazBlue: Centralfiction',
        publisher: 'Arc System Works',
        developer: 'Arc System Works',
        release_year: 2015,
        match_format: '1v1',
        is_active: true,
        latest_version: '2.0',
    },
    {
        game_id: 'melty',
        name: 'Melty Blood: Type Lumina',
        full_name: 'Melty Blood: Type Lumina',
        publisher: 'Delightworks',
        developer: 'French-Bread',
        release_year: 2021,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'samsho',
        name: 'Samurai Shodown',
        full_name: 'Samurai Shodown (2019)',
        publisher: 'SNK',
        developer: 'SNK',
        release_year: 2019,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
    {
        game_id: 'skullgirls',
        name: 'Skullgirls 2nd Encore',
        full_name: 'Skullgirls 2nd Encore',
        publisher: 'Hidden Variable Studios',
        developer: 'Hidden Variable Studios',
        release_year: 2014,
        match_format: 'team_3v3',
        is_active: true,
        latest_version: '4.0',
    },
    {
        game_id: 'vf5',
        name: 'Virtua Fighter 5 US',
        full_name: 'Virtua Fighter 5 Ultimate Showdown',
        publisher: 'Sega',
        developer: 'Sega AM2',
        release_year: 2021,
        match_format: '1v1',
        is_active: true,
        latest_version: '1.0',
    },
];

async function seedGames() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not defined.');
        process.exit(1);
    }

    // Verify registry and seed list are in sync
    const registryIds = VersionResolver.getSupportedGameIds().sort();
    const seedIds = GAMES_FROM_REGISTRY.map(g => g.game_id).sort();
    const missingFromSeed = registryIds.filter(id => !seedIds.includes(id));
    const missingFromRegistry = seedIds.filter(id => !registryIds.includes(id));
    if (missingFromSeed.length) console.warn('[SEED WARNING] In registry but NOT in seed:', missingFromSeed);
    if (missingFromRegistry.length) console.warn('[SEED WARNING] In seed but NOT in registry:', missingFromRegistry);

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        for (const g of GAMES_FROM_REGISTRY) {
            await Game.findOneAndUpdate(
                { game_id: g.game_id },
                { ...g, genre: 'Fighting' },
                { upsert: true, new: true }
            );
            console.log(`[UPSERT] ${g.name} (${g.game_id})`);
        }

        // Remove any game from DB that is no longer in the registry
        // (set is_active: false rather than delete to preserve historical data)
        await Game.updateMany(
            { game_id: { $nin: seedIds } },
            { $set: { is_active: false } }
        );

        console.log(`\nSeed complete. ${GAMES_FROM_REGISTRY.length} games upserted.`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedGames();
