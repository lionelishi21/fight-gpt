import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { IngestionJob } from '../src/models/IngestionJob';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function insertVideo() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const job = new IngestionJob({
    job_id: `ide_test_${randomUUID()}`,
    youtube_url: 'https://www.youtube.com/watch?v=AytD9T5QpXU',
    game_id: 'sf6',
    status: 'pending',
    priority: 100,
    search_query: 'test query',
    created_at: new Date(),
    updated_at: new Date()
  });
  await job.save();
  console.log(`Inserted valid video. Job ID: ${job.job_id}`);
  process.exit(0);
}
insertVideo();
