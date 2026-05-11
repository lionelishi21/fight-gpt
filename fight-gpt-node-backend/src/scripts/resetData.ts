import { Database } from '../config/database';
import { Analysis } from '../models/Analysis';
import { Scenario } from '../models/Scenario';
import { TheoryDoc } from '../models/TheoryDocument';
import { IngestionJob } from '../models/IngestionJob';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables based on execution context
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function resetData() {
  console.log('Connecting to database...');
  await Database.connect();
  
  console.log('Connected. Starting data wipe...');
  
  try {
    // 1. Delete all Analyses
    const analysisResult = await Analysis.deleteMany({});
    console.log(`Deleted ${analysisResult.deletedCount} analyses.`);

    // 2. Delete all Scenarios (this will naturally reset the Vector Index)
    const scenarioResult = await Scenario.deleteMany({});
    console.log(`Deleted ${scenarioResult.deletedCount} scenarios.`);

    // 3. Delete all Theories
    const theoryResult = await TheoryDoc.deleteMany({});
    console.log(`Deleted ${theoryResult.deletedCount} theories.`);

    // 4. Reset all IngestionJobs that were already processed
    // We set them to 'pending' so the BullMQ workers will pick them back up automatically.
    const resetResult = await IngestionJob.updateMany(
      { status: { $in: ['completed', 'failed'] } },
      { 
        $set: { 
          status: 'pending',
          retry_count: 0
        }
      }
    );
    console.log(`Reset ${resetResult.modifiedCount} ingestion jobs back to pending status.`);

    console.log('---');
    console.log('Data wipe and reset complete! Your BullMQ workers will now automatically start re-processing the pending ingestion jobs with the new native video pipeline.');

  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    await Database.disconnect();
    process.exit(0);
  }
}

resetData();
