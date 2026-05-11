import { Database } from './src/config/database';
import { VectorRepository } from './src/repositories/VectorRepository';
import * as dotenv from 'dotenv';
dotenv.config();

async function testVectorDB() {
  await Database.connect();
  console.log('Connected to DB');

  const vectorRepo = new VectorRepository();

  try {
    const dummyVector = Array(768).fill(0.1);
    console.log('Searching Vector DB...');
    const results = await vectorRepo.findSimilarScenarios(dummyVector, 'sf6', 1);
    console.log(`Vector search successful! Found ${results.length} similar scenarios.`);
    
    // Check if the collection is empty
    const count = await vectorRepo['model'].countDocuments();
    console.log(`Total scenarios in DB: ${count}`);
    
  } catch (err) {
    console.error('Vector DB test failed:', err);
  } finally {
    await Database.disconnect();
  }
}

testVectorDB();
