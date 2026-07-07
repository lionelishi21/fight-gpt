import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { IngestionJob } from '../src/models/IngestionJob';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB. Cleaning up unavailable jobs...');
  
  const result = await IngestionJob.deleteMany({ 
    status: 'failed', 
    error_message: { $regex: /unavailable/i } 
  });
  
  console.log(`Deleted ${result.deletedCount} unavailable jobs from the database.`);
  process.exit(0);
}

cleanup();
