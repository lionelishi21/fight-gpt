/**
 * One-shot script: reads ALL pending IngestionJobs from MongoDB and
 * pushes them into the BullMQ Redis queue so the worker can drain them.
 *
 * Run on the server:
 *   node -e "require('dotenv').config(); require('./dist/scripts/bulkQueue.js')"
 * OR after build:
 *   node dist/scripts/bulkQueue.js
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { IngestionJob } from '../models/IngestionJob';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function run() {
    console.log('[BulkQueue] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[BulkQueue] Connected.');

    const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    const queue = new Queue('analysis-queue', { connection: redis });

    const jobs = await IngestionJob.find({ status: 'pending' })
        .sort({ created_at: 1 })
        .lean();

    console.log(`[BulkQueue] Found ${jobs.length} pending jobs. Queuing...`);

    let queued = 0;
    let skipped = 0;

    for (const job of jobs) {
        try {
            await queue.add('analyze-video', {
                job_id: job.job_id,
                game_id: job.game_id,
                youtube_url: job.youtube_url,
                pro_player_id: job.pro_player_id,
                video_title: job.video_title,
            }, {
                jobId: job.job_id,   // deduplicates — won't add if already queued
                attempts: 3,
                backoff: { type: 'exponential', delay: 60000 },
                removeOnComplete: true,
            });
            queued++;
            if (queued % 50 === 0) console.log(`[BulkQueue] Progress: ${queued}/${jobs.length}`);
        } catch (err) {
            skipped++;
        }
    }

    console.log(`[BulkQueue] Done — ${queued} queued, ${skipped} skipped (duplicates).`);
    console.log(`[BulkQueue] Worker will process at 5/min — estimated ${Math.ceil(queued / 5)} minutes.`);

    await queue.close();
    await redis.quit();
    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('[BulkQueue] Fatal error:', err);
    process.exit(1);
});
