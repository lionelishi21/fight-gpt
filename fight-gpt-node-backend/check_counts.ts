import { Database } from './src/config/database';
import { Analysis } from './src/models/Analysis';
import { IngestionJob } from './src/models/IngestionJob';
import dotenv from 'dotenv';

dotenv.config();

async function checkCounts() {
    await Database.connect();
    const analysisCount = await Analysis.countDocuments();
    const jobCount = await IngestionJob.countDocuments();
    const processingJobs = await IngestionJob.find({ status: 'processing' });
    const pendingJobs = await IngestionJob.find({ status: 'pending' });
    const completedJobs = await IngestionJob.find({ status: 'completed' });
    const failedJobs = await IngestionJob.find({ status: 'failed' });

    console.log('Analysis Count:', analysisCount);
    console.log('Total Jobs:', jobCount);
    console.log('Processing Jobs:', processingJobs.length);
    console.log('Pending Jobs:', pendingJobs.length);
    console.log('Completed Jobs:', completedJobs.length);
    console.log('Failed Jobs:', failedJobs.length);

    if (processingJobs.length > 0) {
        console.log('Processing Job Details:', processingJobs.map(j => ({
            id: j.job_id,
            url: j.youtube_url,
            game: j.game_id,
            created: j.created_at
        })));
    }

    process.exit(0);
}

checkCounts();
