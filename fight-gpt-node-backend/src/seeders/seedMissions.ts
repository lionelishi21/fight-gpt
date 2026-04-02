import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Database } from '../config/database';
import Mission from '../models/Mission';
import { Logger } from '../helpers/logger';

dotenv.config();

const missions = [
    {
        title: 'Anti-Air Mastery',
        description: 'Land 10 Anti-Air attacks in Ranked Matches. Focus on reacting to jumps with your DP or cr.HP.',
        type: 'DRILL',
        difficulty: 'MEDIUM',
        reward: { xp: 150, coins: 50 },
        criteria: { count: 10, type: 'anti_air' },
    },
    {
        title: 'Perfect Parry Practice',
        description: 'Perform 5 Perfect Parries. Timing is key!',
        type: 'DRILL',
        difficulty: 'HARD',
        reward: { xp: 300, coins: 100 },
        criteria: { count: 5, type: 'perfect_parry' },
    },
    {
        title: 'Drive Rush combos',
        description: 'Execute 3 combos that extend using Drive Rush.',
        type: 'DRILL',
        difficulty: 'MEDIUM',
        reward: { xp: 200, coins: 75 },
        criteria: { count: 3, type: 'drive_rush_combo' },
    },
    {
        title: 'Replay Analysis Novice',
        description: 'Upload and analyze 1 match replay to identify mistakes.',
        type: 'KNOWLEDGE',
        difficulty: 'EASY',
        reward: { xp: 100, coins: 25 },
        criteria: { count: 1, type: 'analysis_upload' },
    },
    {
        title: 'Matchup Knowledge: Ken',
        description: 'Win 3 matches against Ken players.',
        type: 'MATCHUP',
        difficulty: 'HARD',
        reward: { xp: 250, coins: 80 },
        criteria: { count: 3, type: 'win', opponent_char: 'Ken' },
    },
];

const seedMissions = async () => {
    try {
        await Database.connect();
        Logger.info('Connected to database for seeding...');

        // Clear existing
        await Mission.deleteMany({});
        Logger.info('Cleared existing missions.');

        // Insert new
        await Mission.insertMany(missions);
        Logger.info(`Seeded ${missions.length} missions successfully.`);

        process.exit(0);
    } catch (error) {
        Logger.error('Error seeding missions:', error);
        process.exit(1);
    }
};

seedMissions();
