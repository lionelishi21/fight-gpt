import mongoose from 'mongoose';
import Mission from '../models/Mission';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fightgpt_database';

const missions = [
    {
        title: 'Anti-Air Mastery',
        description: 'Study anti-air scenarios and land 10 successful counters in matches.',
        type: 'DRILL',
        difficulty: 'MEDIUM',
        reward: { xp: 150 },
        targetLink: '/dashboard/scenarios?q=anti-air',
        isActive: true
    },
    {
        title: 'Neutral Control',
        description: 'Learn how to control the neutral game by studying high-level spacing tech.',
        type: 'KNOWLEDGE',
        difficulty: 'EASY',
        reward: { xp: 100 },
        targetLink: '/dashboard/scenarios?q=neutral',
        isActive: true
    },
    {
        title: 'Meta Intelligence',
        description: 'Review the latest character theories to understand current win conditions.',
        type: 'KNOWLEDGE',
        difficulty: 'EASY',
        reward: { xp: 50 },
        targetLink: '/dashboard/meta',
        isActive: true
    },
    {
        title: 'Vortex Escape',
        description: 'Practice escaping character-specific vortex setups from tournament footage.',
        type: 'DRILL',
        difficulty: 'HARD',
        reward: { xp: 250 },
        targetLink: '/dashboard/scenarios?q=vortex',
        isActive: true
    }
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        console.log('Clearing existing missions...');
        await Mission.deleteMany({});

        console.log('Seeding new missions...');
        await Mission.insertMany(missions);

        console.log('Success! Seeded', missions.length, 'missions.');
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
