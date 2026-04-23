/**
 * seedIngestion.ts
 * One-shot script to queue known tournament YouTube URLs into the ingestion pipeline.
 * Run: npx ts-node src/scripts/seedIngestion.ts
 *
 * Use this when yt-dlp is unavailable or you want to guarantee specific high-quality footage.
 * Add more URLs to TOURNAMENT_URLS as you find good content.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { AppConfig } from '../config/app';
import { Logger } from '../helpers/logger';
import { UuidHelper } from '../helpers/uuidHelper';

// ── Add tournament VOD URLs here ────────────────────────────────────────────
// Format: { gameId, url, label }
// Find good URLs from: CEOtaku, EVO, Combo Breaker, VSFighting, Capcom Cup channels
const TOURNAMENT_URLS: { gameId: string; url: string; label: string }[] = [
    // EVO 2024
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=X-C435HjNhg', label: 'SF6 EVO 2024 #1' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=ftboS91Az3A', label: 'SF6 EVO 2024 #2' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=JDNxkPJQxCE', label: 'SF6 EVO 2024 #3' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=-jSvU1x5uWI', label: 'SF6 EVO 2024 #4' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=idevgWCTI3U', label: 'SF6 EVO 2024 #5' },
    // Combo Breaker 2024
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=qQYDz4Y8iq4', label: 'SF6 Combo Breaker 2024 #1' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=v8ubEiY1NW0', label: 'SF6 Combo Breaker 2024 #2' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=L46_1TRDdeQ', label: 'SF6 Combo Breaker 2024 #3' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=b06zAYuXLWE', label: 'SF6 Combo Breaker 2024 #4' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=ED_R1KWnjkA', label: 'SF6 Combo Breaker 2024 #5' },
    // CEO 2024
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=9zbO5pOUK1I', label: 'SF6 CEO 2024 #1' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=RxNKuKHPY_k', label: 'SF6 CEO 2024 #2' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=iKWWOZddo8M', label: 'SF6 CEO 2024 #3' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=k6grIIhkHq0', label: 'SF6 CEO 2024 #4' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=3umOo8mfrm8', label: 'SF6 CEO 2024 #5' },
    // Capcom Cup 2024
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=2Ys4eR5OgTw', label: 'SF6 Capcom Cup 2024 #1' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=v4psG1qeLx8', label: 'SF6 Capcom Cup 2024 #2' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=CFWSn39RQys', label: 'SF6 Capcom Cup 2024 #3' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=qKOXFbh4Nw8', label: 'SF6 Capcom Cup 2024 #4' },
    // Pro Player High Level
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=tzBJ1tZWDE0', label: 'SF6 Pro Player High Level #1' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=ZA52DT7ozyQ', label: 'SF6 Pro Player High Level #2' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=iP8s7Sgq2f8', label: 'SF6 Pro Player High Level #3' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=yXGJVmdgMUs', label: 'SF6 Pro Player High Level #4' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=S3vleFRSocs', label: 'SF6 Pro Player High Level #5' },
];
// ─────────────────────────────────────────────────────────────────────────────

// Minimal inline model — avoids pulling in the full app
const ingestionJobSchema = new mongoose.Schema({
    job_id: { type: String, required: true, unique: true },
    game_id: { type: String, required: true },
    youtube_url: { type: String, required: true, unique: true },
    search_query: String,
    source: String,
    status: { type: String, default: 'pending' },
    retry_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
});

const IngestionJob = mongoose.models.IngestionJob || mongoose.model('IngestionJob', ingestionJobSchema, 'ingestionJobs');

async function main() {
    const realUrls = TOURNAMENT_URLS.filter(u => !u.url.includes('REPLACE_ME'));
    if (realUrls.length === 0) {
        console.error('\n⚠️  No real URLs found. Edit TOURNAMENT_URLS in this script and replace the REPLACE_ME placeholders.\n');
        process.exit(1);
    }

    await mongoose.connect(AppConfig.MONGODB_URI!);
    Logger.info(`Connected to MongoDB — seeding ${realUrls.length} URLs`);

    let queued = 0;
    let skipped = 0;

    for (const { gameId, url, label } of realUrls) {
        try {
            const doc = new IngestionJob({
                job_id: UuidHelper.generate(),
                game_id: gameId,
                youtube_url: url,
                search_query: label,
                source: 'manual_seed',
                status: 'pending',
                retry_count: 0,
            });
            await doc.save();
            queued++;
            Logger.info(`  ✓ Queued [${gameId}] ${label}`);
        } catch (e: any) {
            if (e.code === 11000) {
                skipped++;
                Logger.info(`  ⟳ Skipped (already queued): ${url}`);
            } else {
                Logger.error(`  ✗ Failed: ${label} — ${e.message}`);
            }
        }
    }

    Logger.info(`\nDone — ${queued} queued, ${skipped} already existed`);
    Logger.info('Run processQueue (or use admin seed-and-process) to start analysis.');
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
