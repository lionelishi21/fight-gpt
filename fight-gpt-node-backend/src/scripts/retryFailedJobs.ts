/**
 * Retries jobs sitting in the analysis queue's failed set.
 *
 *   npx tsx src/scripts/retryFailedJobs.ts [count=10]
 *
 * Jobs that exhaust their attempts (e.g. during an API quota outage) stay in
 * BullMQ's failed set, and adding a job with the same job_id is silently
 * ignored, so queuePending.ts cannot requeue them. Attempt counters are reset
 * so each retried job gets its full set of attempts again.
 */
import dotenv from 'dotenv';
dotenv.config();

import { queueService } from '../services/QueueService';

async function main() {
  const count = parseInt(process.argv[2] || '10', 10);
  const queue = queueService.getAnalysisQueue();

  const failed = await queue.getFailed(0, count - 1);
  console.log(`Failed jobs in queue: ${await queue.getFailedCount()} - retrying ${failed.length}`);

  let retried = 0;
  for (const job of failed) {
    await job.retry('failed', { resetAttemptsMade: true, resetAttemptsStarted: true });
    retried++;
  }
  console.log(`Retried ${retried} job(s).`);
  process.exit(0);
}

main().catch(err => {
  console.error('retryFailedJobs failed:', err);
  process.exit(1);
});
