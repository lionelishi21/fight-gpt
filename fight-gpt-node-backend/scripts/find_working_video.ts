import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import { IngestionJob } from '../src/models/IngestionJob';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function findWorkingVideo() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB. Searching for a valid video...');
  
  const jobs = await IngestionJob.find({ status: 'pending' }).sort({ created_at: 1 }).limit(10);
  
  for (const job of jobs) {
    console.log(`Testing ${job.youtube_url}...`);
    try {
      execSync(`yt-dlp --simulate "${job.youtube_url}"`, { stdio: 'ignore' });
      console.log(`FOUND WORKING VIDEO: ${job.youtube_url}`);
      
      job.status = 'processing';
      await job.save();
      
      console.log(JSON.stringify({
          job_id: job.job_id,
          youtube_url: job.youtube_url,
          game_id: job.game_id || 'sf6'
      }));
      process.exit(0);
    } catch (e) {
      console.log(`Video unavailable. Skipping.`);
      job.status = 'failed';
      job.error_message = 'Video unavailable';
      await job.save();
    }
  }
  console.log('No working videos found in the first 10 pending jobs.');
  process.exit(1);
}
findWorkingVideo();
