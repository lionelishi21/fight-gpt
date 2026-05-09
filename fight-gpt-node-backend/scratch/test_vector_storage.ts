/**
 * Diagnostic: test the full vector storage pipeline end-to-end
 * Run: npx tsx scratch/test_vector_storage.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Scenario } from '../src/models/Scenario';
import { UuidHelper } from '../src/helpers/uuidHelper';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function run() {
    console.log('\n=== VECTOR STORAGE DIAGNOSTIC ===\n');

    // 1. Check env vars
    console.log('1. ENV VARS');
    console.log('   MONGODB_URI:', MONGODB_URI ? `✅ set (${MONGODB_URI.slice(0, 30)}...)` : '❌ MISSING');
    console.log('   GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ set' : '❌ MISSING');
    if (!MONGODB_URI || !GEMINI_API_KEY) {
        console.error('\n❌ Missing env vars. Aborting.');
        process.exit(1);
    }

    // 2. MongoDB connection
    console.log('\n2. MONGODB CONNECTION');
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('   ✅ Connected to MongoDB');
    } catch (e: any) {
        console.error('   ❌ MongoDB connection failed:', e.message);
        process.exit(1);
    }

    // 3. Count existing scenarios
    console.log('\n3. EXISTING SCENARIOS IN DB');
    const count = await Scenario.countDocuments();
    console.log(`   Total scenarios: ${count}`);
    if (count > 0) {
        const sample = await Scenario.findOne().select('game_id description characters_involved created_at').lean();
        console.log('   Sample doc:', JSON.stringify(sample, null, 2));
    }

    // 4. Test Gemini embedding
    console.log('\n4. GEMINI EMBEDDING (text-embedding-004)');
    let embedding: number[] = [];
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent('Game: sf6. Matchup: Ryu vs Ken. Situation: Ryu missed punish after blocked Hadoken.');
        embedding = result.embedding.values;
        console.log(`   ✅ Embedding generated — ${embedding.length} dimensions`);
        console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
    } catch (e: any) {
        console.error('   ❌ Embedding failed:', e.message);
        console.error('   This was the original bug. Check GEMINI_API_KEY quota.');
        process.exit(1);
    }

    // 5. Write a test scenario to MongoDB
    console.log('\n5. WRITING TEST SCENARIO TO MONGODB');
    try {
        const testDoc = await Scenario.create({
            scenario_id: UuidHelper.generate(),
            game_id: 'sf6',
            description: '[DIAGNOSTIC TEST] Ryu missed punish after blocked Hadoken at mid-range.',
            context: 'Game: sf6. Matchup: Ryu vs Ken. Situation: Ryu missed punish. Advice: Use cr.MP (5f) instead.',
            characters_involved: ['ryu', 'ken'],
            embedding,
            match_references: ['diagnostic-test'],
            tags: ['punish_missed'],
        });
        console.log(`   ✅ Scenario written to MongoDB`);
        console.log(`   _id: ${testDoc._id}`);
        console.log(`   scenario_id: ${testDoc.scenario_id}`);
    } catch (e: any) {
        console.error('   ❌ Scenario write failed:', e.message);
        process.exit(1);
    }

    // 6. Verify it's in the DB
    console.log('\n6. VERIFY WRITE');
    const newCount = await Scenario.countDocuments();
    const wasWritten = newCount > count;
    console.log(`   Scenarios before: ${count} | after: ${newCount}`);
    console.log(`   Write confirmed: ${wasWritten ? '✅ YES' : '❌ NO — still same count'}`);

    // 7. Test vector search (will warn if index missing, not fail)
    console.log('\n7. ATLAS VECTOR SEARCH (requires vector_index in Atlas UI)');
    try {
        const results = await Scenario.aggregate([{
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: embedding,
                numCandidates: 10,
                limit: 3,
            }
        }, {
            $project: { embedding: 0, score: { $meta: 'vectorSearchScore' } }
        }]).exec();
        console.log(`   ✅ Vector search returned ${results.length} result(s)`);
        if (results.length > 0) {
            console.log(`   Top score: ${(results[0] as any).score?.toFixed(4)}`);
        }
    } catch (e: any) {
        console.warn(`   ⚠️  Vector search failed: ${e.message}`);
        console.warn('   → This is OK for writing. Novelty check falls back to treating all as novel.');
        console.warn('   → To enable dedup: create "vector_index" in MongoDB Atlas UI on the scenarios collection.');
    }

    console.log('\n=== SUMMARY ===');
    console.log('✅ Embedding generation: WORKING');
    console.log(`✅ MongoDB write: WORKING (${newCount} total scenarios)`);
    console.log('→ Deploy this fix and restart the worker on your server.');
    console.log('→ After restart, any new video analysis will populate the scenarios collection.');
    console.log('→ Create the Atlas Vector Search index to enable deduplication (optional but recommended).\n');

    await mongoose.disconnect();
}

run().catch(e => {
    console.error('\n❌ Unhandled error:', e);
    process.exit(1);
});
