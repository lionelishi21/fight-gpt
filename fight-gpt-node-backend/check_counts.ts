import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Analysis } from './src/models/Analysis';
import { Scenario } from './src/models/Scenario';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const analysisCounts = await Analysis.aggregate([
        { $group: { _id: "$game_id", count: { $sum: 1 } } }
    ]);
    console.log('Analysis counts per game:', analysisCounts);

    const scenarioCount = await Scenario.countDocuments();
    console.log('Total Vector Scenarios:', scenarioCount);

    const sample = await Scenario.findOne().select('description game_id embedding');
    if (sample) {
        console.log('Sample Scenario Found:', sample.description);
        console.log('Embedding present:', !!sample.embedding && (sample.embedding as any).length > 0);
    } else {
        console.log('No Scenarios found in vector DB yet.');
    }

    await mongoose.disconnect();
}

check();
