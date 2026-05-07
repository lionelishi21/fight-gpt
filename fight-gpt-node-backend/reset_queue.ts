import { Database } from './src/config/database';
import { IngestionJob } from './src/models/IngestionJob';
import { queueService } from './src/services/QueueService';
import dotenv from 'dotenv';

dotenv.config();

async function resetQueue() {
    try {
        await Database.connect();
        
        // 1. Update IngestionJob documents in MongoDB
        const failedJobs = await IngestionJob.find({ status: 'failed' });
        console.log(`Found ${failedJobs.length} failed jobs in MongoDB.`);
        
        const result = await IngestionJob.updateMany(
            { status: 'failed' },
            { $set: { status: 'pending', error_message: null } }
        );
        console.log(`Reset ${result.modifiedCount} jobs to 'pending' in MongoDB.`);

        // 2. Clear BullMQ failed jobs and re-add them
        const queue = queueService.getAnalysisQueue();
        const failedBullJobs = await queue.getFailed(0, 500);
        console.log(`Found ${failedBullJobs.length} failed jobs in BullMQ.`);

        for (const job of failedBullJobs) {
            // Re-add the job data to the queue
            if (job.data) {
                await queueService.addAnalysisJob(job.data);
                // Remove from failed set
                await job.remove();
            }
        }
        console.log(`Re-added ${failedBullJobs.length} jobs to BullMQ.`);

    } catch (e) {
        console.error('Error during queue reset:', e);
    }
    process.exit(0);
}

resetQueue();
