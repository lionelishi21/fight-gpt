import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User';
import { Analysis } from '../models/Analysis';

// Use require to bypass type check issues on broken service exports
const { AnalysisRepository } = require('../repositories/AnalysisRepository');
const { AnalysisService } = require('../services/AnalysisService');
const { AiService } = require('../services/AiService');
const { GameMetadataService } = require('../services/GameMetadataService');
const { CharacterEncyclopediaService } = require('../services/CharacterEncyclopediaService');
const { CharacterService } = require('../services/CharacterService');
const { VectorRepository } = require('../repositories/VectorRepository');
const { GameRepository } = require('../repositories/GameRepository');
const { CharacterRepository } = require('../repositories/CharacterRepository');
const { GameMetadataRepository } = require('../repositories/GameMetadataRepository');
const { CharacterEncyclopediaRepository } = require('../repositories/CharacterEncyclopediaRepository');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found. Cannot force re-analysis.');
    process.exit(1);
  }
  const adminId = admin._id.toString();
  console.log(`Using admin: ${admin.name} (${adminId})`);

  // Initialize dependencies
  const analysisRepo = new AnalysisRepository();
  const gameRepo = new GameRepository();
  const charRepo = new CharacterRepository();
  const gameMetadataRepo = new GameMetadataRepository();
  const charEncyclopediaRepo = new CharacterEncyclopediaRepository();
  const vectorRepo = new VectorRepository();
  
  const gameMetadataService = new GameMetadataService(gameMetadataRepo);
  const charEncyclopediaService = new CharacterEncyclopediaService(charEncyclopediaRepo);
  const characterService = new CharacterService(charRepo, gameRepo);
  
  const aiService = new AiService(
    process.env.GEMINI_API_KEY as string,
    process.env.GEMINI_MODEL || 'gemini-pro-latest',
    gameMetadataService,
    charEncyclopediaService
  );

  const analysisService = new AnalysisService(
    analysisRepo,
    aiService,
    gameMetadataService,
    charEncyclopediaService,
    characterService,
    vectorRepo
  );

  // Fetch ALL analyses to fix the "wrong source" issues globally
  const analyses = await Analysis.find().lean();
  console.log(`Found ${analyses.length} total analyses.`);

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  let count = 0;
  for (const match of analyses) {
    count++;
    console.log(`[${count}/${analyses.length}] Checking match ${match.analysis_id}...`);
    /*
    // Skip if already regenerated recently (to handle resume after quota hits)
    if (match.updated_at && match.updated_at > twoHoursAgo) {
      console.log(`Skipping match ${match.analysis_id} - already updated recently.`);
      continue;
    }
    */
    const youtubeUrl = match.youtube_url || (match.analysis as any)?.youtube_url;
    if (!youtubeUrl) {
      console.log(`Skipping match ${match.analysis_id} - no URL found.`);
      continue;
    }

    console.log(`Regenerating: ${match.analysis_id} - ${youtubeUrl}`);
    try {
      const result = await analysisService.analyzeVideo({
        youtube_url: youtubeUrl,
        game_id: match.game_id,
        force: true
      }, adminId);

      if (result.success) {
        console.log(`Successfully regenerated ${match.analysis_id}`);
      } else {
        console.error(`Failed to regenerate ${match.analysis_id}: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error regenerating ${match.analysis_id}:`, err);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(console.error);
