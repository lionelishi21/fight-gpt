import { Database } from '../src/config/database';
import { IngestionJob } from '../src/models/IngestionJob';
import dotenv from 'dotenv';

dotenv.config();

async function findJob(id: string) {
    try {
        await Database.connect();
        const job = await IngestionJob.findOne({ analysis_id: id }).lean();
        if (job) {
            console.log('Found Job by analysis_id:', job);
            return;
        }
        const jobByJobId = await IngestionJob.findOne({ job_id: id }).lean();
        if (jobByJobId) {
            console.log('Found Job by job_id:', jobByJobId);
            return;
        }
        console.log('Job not found');
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

const id = '37cb8144-2d9d-46cf-adb9-156f2cacbbe6';
findJob(id);
