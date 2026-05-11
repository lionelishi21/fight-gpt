import { Database } from './src/config/database';
import { VectorRepository } from './src/repositories/VectorRepository';
import { AiService } from './src/services/AiService';
import { GameMetadataService } from './src/services/GameMetadataService';
import { CharacterEncyclopediaService } from './src/services/CharacterEncyclopediaService';
import { GameMetadataRepository } from './src/repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from './src/repositories/CharacterEncyclopediaRepository';
import { AppConfig } from './src/config/app';
import * as dotenv from 'dotenv';
dotenv.config();

async function testVectorDB() {
  await Database.connect();
  console.log('Connected to DB');

  const vectorRepo = new VectorRepository();
  const metaRepo = new GameMetadataRepository();
  const encRepo = new CharacterEncyclopediaRepository();
  
  const aiService = new AiService(
    AppConfig.GEMINI_API_KEY,
    AppConfig.GEMINI_MODEL,
    new GameMetadataService(metaRepo),
    new CharacterEncyclopediaService(encRepo)
  );

  try {
    console.log('Generating dummy embedding...');
    const embedding = await aiService.generateEmbedding('Test vector search for SF6 Ryu vs Ken');
    console.log(`Generated embedding of length ${embedding.length}`);

    console.log('Searching Vector DB...');
    const results = await vectorRepo.findSimilarScenarios(embedding, 'sf6', 1);
    console.log(`Vector search successful! Found ${results.length} similar scenarios.`);
    
    // Check if the collection is empty
    const count = await vectorRepo['model'].countDocuments();
    console.log(`Total scenarios in DB: ${count}`);
    
    if (results.length === 0 && count > 0) {
        console.log('WARNING: DB has scenarios but vector search returned 0. This might mean the Atlas Vector Search Index "vector_index" is missing or misconfigured.');
    } else if (results.length === 0 && count === 0) {
        console.log('Note: 0 results returned because the database is empty. Vector search query executed without throwing errors.');
    }
    
  } catch (err) {
    console.error('Vector DB test failed:', err);
  } finally {
    await Database.disconnect();
  }
}

testVectorDB();
