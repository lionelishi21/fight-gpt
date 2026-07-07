import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import mongoose from 'mongoose';
import { Analysis } from '../models/Analysis';

async function main() {
    try {
        await Database.connect();
        const doc = await Analysis.findOne({ analysis_id: 'f62391d2-2f45-4b8b-8507-da7ebbc5eb15' }).lean();
        console.log(JSON.stringify(doc, null, 2));
        await Database.disconnect();
    } catch (e) {
        console.error(e);
    }
}
main();
