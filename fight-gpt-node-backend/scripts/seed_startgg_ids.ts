import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Game } from '../src/models/Game';
import { AppConfig } from '../src/config/app';

const MAPPINGS = [
  { game_id: 'sf6', startgg_id: 43868 },
  { game_id: 'tekken8', startgg_id: 49931 },
];

async function run() {
  try {
    if (!AppConfig.MONGODB_URI) {
      console.error('MONGODB_URI is not defined');
      process.exit(1);
    }

    await mongoose.connect(AppConfig.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const mapping of MAPPINGS) {
      const result = await Game.updateOne(
        { game_id: mapping.game_id },
        { $set: { startgg_id: mapping.startgg_id } }
      );
      if (result.matchedCount > 0) {
        console.log(`Updated ${mapping.game_id} with startgg_id ${mapping.startgg_id}`);
      } else {
        console.log(`Game ${mapping.game_id} not found in DB`);
      }
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
