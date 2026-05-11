import mongoose from 'mongoose';
import { IngestionJob } from './src/models/IngestionJob';
import dotenv from 'dotenv';

dotenv.config();

async function checkJobs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fightgpt');
        console.log('Connected to MongoDB');

        const processingJobs = await IngestionJob.find({ status: 'processing' });
        console.log(`Found ${processingJobs.length} jobs in "processing" state:`);
        
        processingJobs.forEach(job => {
            console.log(`- Job ID: ${job.job_id}, Game: ${job.game_id}, URL: ${job.youtube_url}, Updated At: ${job.updated_at}`);
        });

        const pendingJobs = await IngestionJob.countDocuments({ status: 'pending' });
        console.log(`Total Pending Jobs: ${pendingJobs}`);

        // BullMQ Check
        const { Queue } = require('bullmq');
        const IORedis = require('ioredis');
        const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
        const queue = new Queue('analysis-queue', { connection });

        const [waiting, active, failed, delayed, completed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
            queue.getCompletedCount(),
        ]);

        console.log('\nBullMQ Analysis Queue Status:');
        console.log(`- Waiting: ${waiting}`);
        console.log(`- Active: ${active}`);
        console.log(`- Failed: ${failed}`);
        console.log(`- Delayed: ${delayed}`);
        console.log(`- Completed: ${completed}`);

        const heartbeat = await connection.get('metapunish:worker:heartbeat');
        console.log(`\nWorker Heartbeat: ${heartbeat ? 'ONLINE (' + heartbeat + ')' : 'OFFLINE'}`);

        await connection.quit();
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkJobs();
