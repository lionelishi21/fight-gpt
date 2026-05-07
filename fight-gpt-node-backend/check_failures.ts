import { queueService } from './src/services/QueueService';
import dotenv from 'dotenv';

dotenv.config();

async function checkFailures() {
    const queue = queueService.getAnalysisQueue();
    const failed = await queue.getFailed(0, 5);
    console.log('Sample Failures:');
    failed.forEach(job => {
        console.log(`Job ${job.id}: ${job.failedReason}`);
    });
    process.exit(0);
}

checkFailures();
