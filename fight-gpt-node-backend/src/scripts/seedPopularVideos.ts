import mongoose from 'mongoose';
import { Database } from '../config/database';
import { queueService } from '../services/QueueService';
import { IngestionRepository } from '../repositories/IngestionRepository';
import { UuidHelper } from '../helpers/uuidHelper';

/**
 * Seeds popular videos for characters to ensure initial SEO pages have content.
 */
const popularVideos = [
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=FjI88q2UUSY', title: 'SF6 EVO 2024 Grand Finals' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=Ue5h2x4_r_A', title: 'SF6 Capcom Cup X Finals' },
    { gameId: 'tekken8', url: 'https://www.youtube.com/watch?v=k1_s1lUjE_g', title: 'Tekken 8 EVO Japan 2024' }
];

async function seed() {
    await Database.connect();
    console.log('Database connected.');

    const ingestionRepo = new IngestionRepository();

    for (const vid of popularVideos) {
        const existing = await ingestionRepo.findByUrl(vid.url);
        if (existing) {
            console.log(`Video already exists: ${vid.url}`);
            continue;
        }

        const job = await ingestionRepo.createJob({
            job_id: UuidHelper.generate(),
            game_id: vid.gameId,
            youtube_url: vid.url,
            search_query: 'SEO_SEED',
            source: 'scheduled',
            status: 'pending',
            retry_count: 0,
            video_title: vid.title
        });

        await queueService.addAnalysisJob({
            source: 'ingestion',
            job_id: job.job_id,
            game_id: vid.gameId,
            youtube_url: vid.url,
            video_title: vid.title
        });

        console.log(`Queued seed video: ${vid.title}`);
    }

    console.log('Seeding complete.');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
