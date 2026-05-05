import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Game } from '../models/Game';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedGames() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not defined.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const games = [
            {
                game_id: 'sf6',
                name: 'Street Fighter 6',
                full_name: 'Street Fighter 6',
                publisher: 'Capcom',
                developer: 'Capcom',
                genre: 'Fighting',
                is_active: true,
                latest_version: '1.0'
            },
            {
                game_id: 'tekken8',
                name: 'Tekken 8',
                full_name: 'Tekken 8',
                publisher: 'Bandai Namco',
                developer: 'Bandai Namco',
                genre: 'Fighting',
                is_active: true,
                latest_version: '1.0'
            },
            {
                game_id: 'ggst',
                name: 'Guilty Gear Strive',
                full_name: 'Guilty Gear -Strive-',
                publisher: 'Arc System Works',
                developer: 'Arc System Works',
                genre: 'Fighting',
                is_active: true,
                latest_version: '1.0'
            },
            {
                game_id: 'mk1',
                name: 'Mortal Kombat 1',
                full_name: 'Mortal Kombat 1',
                publisher: 'Warner Bros.',
                developer: 'NetherRealm Studios',
                genre: 'Fighting',
                is_active: true,
                latest_version: '1.0'
            },
            {
                game_id: 'dbfz',
                name: 'Dragon Ball FighterZ',
                full_name: 'Dragon Ball FighterZ',
                publisher: 'Bandai Namco',
                developer: 'Arc System Works',
                genre: 'Fighting',
                is_active: true,
                latest_version: '1.0'
            },
            {
                game_id: 'mvc3',
                name: 'Marvel vs. Capcom 3',
                full_name: 'Ultimate Marvel vs. Capcom 3',
                publisher: 'Capcom',
                developer: 'Capcom',
                genre: 'Fighting',
                is_active: true,
                latest_version: '1.0'
            }
        ];

        for (const g of games) {
            await Game.findOneAndUpdate(
                { game_id: g.game_id },
                g,
                { upsert: true, new: true }
            );
            console.log(`[UPSERT] ${g.name} (${g.game_id})`);
        }

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedGames();
