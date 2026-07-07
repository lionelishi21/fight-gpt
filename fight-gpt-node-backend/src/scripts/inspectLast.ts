import dotenv from 'dotenv';
dotenv.config();

import { Database } from '../config/database';
import mongoose from 'mongoose';
import { Analysis } from '../models/Analysis';

async function main() {
    try {
        await Database.connect();
        const doc = await Analysis.findOne({ analysis_id: '802682db-2dad-470a-a454-1b7106685955' }).lean();
        console.log(JSON.stringify(doc, null, 2));
        await Database.disconnect();
    } catch (e) {
        console.error(e);
    }
}
main();
