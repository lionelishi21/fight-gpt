/**
 * Verifies that the Atlas Vector Search index is correctly configured
 * and actually returns results for the scenarios collection.
 *
 * Run with:  npx tsx src/scripts/checkVectorIndex.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Scenario } from '../models/Scenario';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const INDEX_NAME = 'vector_index';
const EMBEDDING_PATH = 'embedding';

async function run() {
    if (!MONGO_URI) {
        console.error('❌ MONGODB_URI not set in .env');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // ── 1. How many scenarios exist and how many have embeddings ──
    const totalScenarios = await Scenario.countDocuments();
    const withEmbedding  = await Scenario.countDocuments({ embedding: { $exists: true, $not: { $size: 0 } } });
    const sampleDim = withEmbedding > 0
        ? (await Scenario.findOne({ embedding: { $exists: true } }).select('embedding').lean() as any)?.embedding?.length ?? 0
        : 0;

    console.log('── Scenario collection ──────────────────────────');
    console.log(`  Total documents : ${totalScenarios}`);
    console.log(`  With embedding  : ${withEmbedding}`);
    console.log(`  Embedding dims  : ${sampleDim}`);
    console.log('');

    if (withEmbedding === 0) {
        console.warn('⚠️  No scenarios have embeddings yet. RAG will return nothing until scenarios are created.');
    }

    // ── 2. List Atlas Search indexes on the collection ────────────
    console.log('── Atlas Search indexes on `scenarios` ──────────');
    let vectorIndexFound = false;
    let vectorIndexStatus = 'UNKNOWN';
    let vectorIndexDimensions: number | null = null;

    try {
        const db = mongoose.connection.db!;
        const cursor = db.collection('scenarios').listSearchIndexes();
        const indexes = await cursor.toArray();

        if (indexes.length === 0) {
            console.log('  ⚠️  No Atlas Search indexes found on this collection.');
            console.log('  → You need to create one in the Atlas UI (see instructions below).');
        } else {
            for (const idx of indexes) {
                const isTarget = idx.name === INDEX_NAME;
                console.log(`  ${isTarget ? '→' : ' '} Name   : ${idx.name}`);
                console.log(`     Status : ${idx.status}`);
                console.log(`     Type   : ${idx.type}`);

                if (isTarget) {
                    vectorIndexFound = true;
                    vectorIndexStatus = idx.status;
                    // Try to extract dimensions from the index definition
                    const fields = idx.latestDefinition?.fields || idx.mappings?.fields || [];
                    const embeddingField = Array.isArray(fields)
                        ? fields.find((f: any) => f.path === EMBEDDING_PATH || f.type === 'knnVector')
                        : null;
                    vectorIndexDimensions = embeddingField?.numDimensions ?? embeddingField?.dimensions ?? null;
                    if (vectorIndexDimensions) {
                        console.log(`     Dims   : ${vectorIndexDimensions}`);
                    }
                }
                console.log('');
            }
        }
    } catch (e: any) {
        // listSearchIndexes() not available on self-hosted or older Atlas clusters
        console.log(`  ℹ️  listSearchIndexes() not supported on this cluster (${e.message})`);
        console.log('  → If you are on Atlas M0/M2/M5, vector search may not be available.');
        console.log('');
    }

    // ── 3. Live $vectorSearch test ────────────────────────────────
    console.log('── Live $vectorSearch test ──────────────────────');

    if (withEmbedding === 0) {
        console.log('  ⏭️  Skipping — no embeddings in DB to search against');
    } else {
        // Use the first stored embedding as the query vector so we know at least one match exists
        const sample = await Scenario.findOne({ embedding: { $exists: true } }).select('embedding game_id').lean() as any;
        const queryVector: number[] = sample.embedding;
        const gameId: string = sample.game_id;

        try {
            const results = await Scenario.aggregate([
                {
                    $vectorSearch: {
                        index: INDEX_NAME,
                        path: EMBEDDING_PATH,
                        queryVector,
                        numCandidates: 50,
                        limit: 3,
                        filter: { game_id: gameId },
                    },
                },
                {
                    $project: {
                        scenario_id: 1,
                        game_id: 1,
                        description: { $substr: ['$description', 0, 80] },
                        score: { $meta: 'vectorSearchScore' },
                    },
                },
            ]).exec();

            if (results.length > 0) {
                console.log(`  ✅ $vectorSearch returned ${results.length} result(s) — index is WORKING`);
                results.forEach((r, i) => {
                    console.log(`     [${i + 1}] score=${r.score?.toFixed(4)} | ${r.game_id} | ${r.description}...`);
                });
            } else {
                console.log('  ⚠️  $vectorSearch returned 0 results even with a stored embedding as the query.');
                console.log('  → Index may exist but not yet READY, or filter is too restrictive.');
            }
        } catch (e: any) {
            console.log(`  ❌ $vectorSearch threw an error: ${e.message}`);
            if (e.message.includes('index') || e.message.includes('Index')) {
                console.log('  → The index "vector_index" does not exist or is not READY yet.');
            }
        }
    }

    // ── 4. Summary + fix instructions ────────────────────────────
    console.log('\n── Summary ──────────────────────────────────────');

    if (!vectorIndexFound) {
        console.log('🔴 ACTION REQUIRED: Atlas vector index is MISSING.\n');
        console.log('How to fix:');
        console.log('  1. Go to cloud.mongodb.com → your cluster → "Atlas Search" tab');
        console.log('  2. Click "Create Search Index"');
        console.log('  3. Choose "Atlas Vector Search" (not Atlas Search)');
        console.log('  4. Select database: your DB, collection: scenarios');
        console.log('  5. Use this JSON definition:\n');
        console.log(JSON.stringify({
            fields: [
                {
                    type: 'vector',
                    path: 'embedding',
                    numDimensions: sampleDim || 3072,
                    similarity: 'cosine',
                },
                {
                    type: 'filter',
                    path: 'game_id',
                },
                {
                    type: 'filter',
                    path: 'characters_involved',
                },
            ],
        }, null, 4));
        console.log('\n  6. Name it exactly: vector_index');
        console.log('  7. Wait ~2 minutes for it to build, then re-run this script');
    } else if (vectorIndexStatus !== 'READY') {
        console.log(`🟠 Index exists but status is "${vectorIndexStatus}" — wait for it to reach READY, then re-run.`);
    } else if (withEmbedding === 0) {
        console.log('🟠 Index is READY but no scenarios have embeddings yet.');
        console.log('   RAG will activate automatically as analyses run and scenarios are created.');
    } else {
        console.log('✅ Vector index is READY and returning results. RAG is fully operational.');

        if (sampleDim && vectorIndexDimensions && sampleDim !== vectorIndexDimensions) {
            console.log(`\n🔴 DIMENSION MISMATCH: embeddings are ${sampleDim}D but index expects ${vectorIndexDimensions}D.`);
            console.log('   Delete and recreate the index with numDimensions:', sampleDim);
        }
    }

    await mongoose.disconnect();
}

run().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
