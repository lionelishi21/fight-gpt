import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { IngestionJob } from '../src/models/IngestionJob';
import { Analysis } from '../src/models/Analysis';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function revert() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not defined in .env');
        await mongoose.connect(mongoUri);

        const jobIds = [
            'ff59b8af-f33f-4aca-bcea-fbadc05ed42d',
            'd1d040eb-e229-4623-a58a-9f1b1f2514e9',
            '8d9aaa93-0202-4a7a-89c5-a570f2812747'
        ];

        const analysisIds = [
            '4ade4c9f-4462-419f-ae0e-1d7a474eaaec',
            'a8b532ed-1a21-4206-a345-484e7a9a66f3',
            '2e13d323-94f6-4a62-9d6f-1c434f7308c3'
        ];

        await Analysis.deleteMany({ analysis_id: { $in: analysisIds } });
        console.log('Deleted bad Analysis records.');

        await IngestionJob.updateMany(
            { job_id: { $in: jobIds } },
            { $set: { status: 'pending' }, $unset: { analysis_id: '', processed_at: '', scenario_count: '' } }
        );
        console.log('Reverted IngestionJob statuses to pending.');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

revert();
