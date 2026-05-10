import mongoose from 'mongoose';
import { Analysis } from '../src/models/Analysis';
import { IngestionJob } from '../src/models/IngestionJob';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function purgeBadAnalyses() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fight_gpt';
    console.log(`Connecting to ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Purge generic "Luke vs Ken" hallucinations for SF6
    const genericSf6Query = {
        game_id: 'sf6',
        p1_name: null,
        p2_name: null,
        'analysis.p1_character': 'Luke',
        'analysis.p2_character': 'Ken'
    };

    const count1 = await Analysis.countDocuments(genericSf6Query);
    console.log(`Found ${count1} generic SF6 hallucinations (Luke vs Ken, no names).`);
    
    if (count1 > 0) {
        const res = await Analysis.deleteMany(genericSf6Query);
        console.log(`Successfully purged ${res.deletedCount} generic SF6 records.`);
    }

    // 2. Find and purge duplicates for the same YouTube URL
    // We want to keep ONLY one analysis per unique YouTube URL
    const duplicates = await Analysis.aggregate([
        { $match: { video_source: 'youtube' } },
        { $group: {
            _id: '$youtube_url',
            count: { $sum: 1 },
            ids: { $push: '$_id' }
        }},
        { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicates.length} YouTube URLs with duplicate analyses.`);

    let duplicatePurgeCount = 0;
    for (const group of duplicates) {
        // Keep the first one, delete the rest
        const toDelete = group.ids.slice(1);
        const res = await Analysis.deleteMany({ _id: { $in: toDelete } });
        duplicatePurgeCount += res.deletedCount;
    }
    console.log(`Successfully purged ${duplicatePurgeCount} duplicate analysis records.`);

    // 3. Optional: Clear related ingestion jobs that might re-trigger bad analyses
    // For simplicity, we just clear jobs that match purged URLs if they are already completed
    // (This prevents them from being "seen" as processed if we ever want to re-ingest)
    
    await mongoose.disconnect();
    console.log('Done.');
}

purgeBadAnalyses().catch(err => {
    console.error('Purge failed:', err);
    process.exit(1);
});
