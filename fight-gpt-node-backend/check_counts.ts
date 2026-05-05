import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Analysis } from './src/models/Analysis';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const counts = await Analysis.aggregate([
        { $group: { _id: "$game_id", count: { $sum: 1 } } }
    ]);
    console.log('Analysis counts per game:', counts);
    await mongoose.disconnect();
}

check();
