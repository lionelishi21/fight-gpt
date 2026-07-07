import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { IngestionJob } from '../src/models/IngestionJob';
import { Analysis } from '../src/models/Analysis';
import { Scenario } from '../src/models/Scenario';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanupBadData() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not defined in .env');
        await mongoose.connect(mongoUri);

        const jobId = '8d9aaa93-0202-4a7a-89c5-a570f2812747';
        const analysisId = '56b2a665-06d0-4a99-baba-157c25610f70';

        // 1. Delete Analysis
        const analysisRes = await Analysis.deleteOne({ analysis_id: analysisId });
        console.log(`Deleted ${analysisRes.deletedCount} Analysis record.`);

        // 2. Delete Scenarios referencing this analysis
        const scenarioRes = await Scenario.deleteMany({ match_references: analysisId });
        console.log(`Deleted ${scenarioRes.deletedCount} bad Scenarios from vector DB.`);

        // 3. Mark Job as rejected
        const jobRes = await IngestionJob.updateOne(
            { job_id: jobId },
            { $set: { status: 'rejected', error_message: 'Rejected: Mismatched game (SF4 video for SF6 job)' } }
        );
        console.log(`Marked IngestionJob as rejected. Updated: ${jobRes.modifiedCount}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

cleanupBadData();
