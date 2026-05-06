import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { ProPlayer } from '../models/ProPlayer';
import { Logger } from '../helpers/logger';

const PRO_PLAYERS = [
    // --- STREET FIGHTER 6 ---
    {
        name: 'Capcom Fighters',
        gameId: 'sf6',
        region: 'Global',
        isVerified: true,
        channels: ['UC52Jj_1x4YJ9u-F8l8V8-sQ']
    },
    {
        name: 'Punkdagod',
        gameId: 'sf6',
        region: 'USA',
        isVerified: true,
        channels: ['UCw5D6JvWn7L6fU5pC2G_y3Q']
    },
    {
        name: 'Daigo the Beast',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UCp2W74h9F3j-yX4Y9k4yqPQ']
    },
    {
        name: 'Justin Wong',
        gameId: 'sf6',
        region: 'USA',
        isVerified: true,
        channels: ['UC_1_x2qDk2dJ5z-j6f0v-sw']
    },
    {
        name: 'Tokido',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UC0Q4-xZ7Wc6XhB0C9q_t55w']
    },

    // --- TEKKEN 8 ---
    {
        name: 'Bandai Namco Esports',
        gameId: 'tekken8',
        region: 'Global',
        isVerified: true,
        channels: ['UCk33n9tH3n6lZ72v-p4E26A']
    },
    {
        name: 'Arslan Ash',
        gameId: 'tekken8',
        region: 'Other',
        isVerified: true,
        channels: ['UCN_Xz0q91l0B2n5v-jQ8yAg']
    },
    {
        name: 'PhiDX',
        gameId: 'tekken8',
        region: 'USA',
        isVerified: true,
        channels: ['UC8w77vS4875323Q-9o9R56w']
    },
    {
        name: 'TheMainManSWE',
        gameId: 'tekken8',
        region: 'Europe',
        isVerified: true,
        channels: ['UCgX-Z4aW89X6f-t-N4l2N3g']
    },

    // --- JAPANESE PROS (SF6) ---
    {
        name: 'Itabashi Zangief',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UCG_9J2gJ49uWnF7gC6S-d-g']
    },
    {
        name: 'Gachikun',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UCz-70LhQxZ8v9u1L_o84_zQ']
    },
    {
        name: 'Kakeru',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UCs72L-Tf4G5X0T6b0V8v08w']
    },
    {
        name: 'Nemo',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UC8BCNz98vpzaFkqniBB27FA']
    },
    {
        name: 'Mago',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UCw1rPzT_Y4448p251P2c-6g']
    },
    {
        name: 'Momochi',
        gameId: 'sf6',
        region: 'Japan',
        isVerified: true,
        channels: ['UCy7wJ-c8iC8-4S3oT8Y1o4g']
    },

    // --- JAPANESE PROS (TEKKEN 8) ---
    {
        name: 'Chikurin',
        gameId: 'tekken8',
        region: 'Japan',
        isVerified: true,
        channels: ['UCLrM7rLq8tXGf5N5_7LpY3w']
    },
    {
        name: 'Nobi',
        gameId: 'tekken8',
        region: 'Japan',
        isVerified: true,
        channels: ['UCtXm2962y-91K0xZqK_N_5Q']
    }
];

async function seedProPlayers() {
    try {
        await Database.connect();
        Logger.info(`🌱 Seeding ${PRO_PLAYERS.length} Pro Players...`);

        for (const pro of PRO_PLAYERS) {
            await ProPlayer.updateOne(
                { name: pro.name, gameId: pro.gameId },
                { $set: pro },
                { upsert: true }
            );
            Logger.info(`✅ Seeded: ${pro.name} (${pro.gameId})`);
        }

        Logger.info('🎉 Pro Player Registry seeded successfully!');
        process.exit(0);
    } catch (e) {
        Logger.error('❌ Seeding failed:', e);
        process.exit(1);
    }
}

seedProPlayers();
