import { Database } from './src/config/database';
import { Scenario } from './src/models/Scenario';
import Analysis from './src/models/Analysis';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkDb() {
  await Database.connect();
  const scens = await Scenario.countDocuments();
  const analyses = await Analysis.countDocuments();
  console.log('Scenarios count:', scens);
  console.log('Analyses count:', analyses);
  
  if (scens > 0) {
    const sample = await Scenario.findOne();
    console.log('Sample Scenario embeddings length:', sample?.embedding?.length);
  }
  
  await Database.disconnect();
}
checkDb();
