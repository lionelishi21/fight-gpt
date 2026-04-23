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
    // SF6 — replace/expand with real tournament VODs you want analyzed
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=REPLACE_ME_1', label: 'SF6 EVO 2024 Top 8' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=REPLACE_ME_2', label: 'SF6 Combo Breaker 2024 Grand Finals' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=REPLACE_ME_3', label: 'SF6 CEO 2024 Top 8' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=REPLACE_ME_4', label: 'SF6 Capcom Cup X Top 8' },
    { gameId: 'sf6', url: 'https://www.youtube.com/watch?v=REPLACE_ME_5', label: 'SF6 VSFighting 2024 Grand Finals' },
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
            await IngestionJob.create({
                job_id: UuidHelper.generate(),
                game_id: gameId,
                youtube_url: url,
                search_query: label,
                source: 'manual_seed',
                status: 'pending',
                retry_count: 0,
            });
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
