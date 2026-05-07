import { queueService } from './src/services/QueueService';
import dotenv from 'dotenv';

dotenv.config();

async function checkQueue() {
    const queue = queueService.getAnalysisQueue();
    const counts = await queue.getJobCounts();
    console.log('BullMQ Analysis Queue Counts:', counts);
    process.exit(0);
}

checkQueue();
