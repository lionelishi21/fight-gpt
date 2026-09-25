/**
 * Queues the oldest pending ingestion jobs into the analysis queue.
 *
 *   npx tsx src/scripts/queuePending.ts [count=10] [gameId]
 *
 * Runs the same enqueue step as POST /api/admin/ingestion/bulk-queue, without
 * the login token that route also requires. BullMQ dedupes by job_id, so
 * re-running is safe. Use a small count first to check the pipeline end to end.
 */
import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { queueService } from '../services/QueueService';

async function main() {
  const count = parseInt(process.argv[2] || '10', 10);
  const gameId = process.argv[3];

  await Database.connect();
  try {
    const repo = new IngestionRepository();
    const all = await repo.getPendingJobs(gameId, 100000);
    console.log(`Pending ingestion jobs: ${all.length}${gameId ? ` (game ${gameId})` : ''}`);

    let queued = 0;
    for (const job of all.slice(0, count)) {
      await queueService.addAnalysisJob({
        source: 'ingestion',
        job_id: job.job_id,
        game_id: job.game_id,
        youtube_url: job.youtube_url,
        pro_player_id: job.pro_player_id,
        video_title: job.video_title,
      });
      queued++;
    }
    console.log(`Queued ${queued} job(s).`);
  } finally {
    await Database.disconnect();
  }
  process.exit(0);
}

main().catch(err => {
  console.error('queuePending failed:', err);
  process.exit(1);
});
