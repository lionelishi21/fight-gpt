import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { IngestionJob } from '../src/models/IngestionJob';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function getPendingVideo() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not defined in .env');
        }

        await mongoose.connect(mongoUri);

        const job = await IngestionJob.findOne({ status: 'pending' }).sort({ created_at: 1 });
        
        if (!job) {
            console.log(JSON.stringify({ error: 'No pending videos found.' }));
            process.exit(0);
        }

        // We mark it as 'processing' so it doesn't get picked up by another worker.
        job.status = 'processing';
        await job.save();

        console.log(JSON.stringify({
            job_id: job.job_id,
            youtube_url: job.youtube_url,
            game_id: job.game_id || 'sf6',
            message: 'Pending video fetched successfully.'
        }, null, 2));

        process.exit(0);
    } catch (error: any) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

getPendingVideo();
