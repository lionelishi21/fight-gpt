import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { AnalysisService } from '../services/AnalysisService';
import { AiService } from '../services/AiService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { CharacterService } from '../services/CharacterService';
import { VectorRepository } from '../repositories/VectorRepository';
import { NotificationService } from '../repositories/NotificationRepository';
import { RivalRepository } from '../repositories/RivalRepository';
import { GameRepository } from '../repositories/GameRepository';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { User } from '../models/User';
import { Logger } from '../helpers/logger';

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
  const notificationRepo = new mongoose.Schema({}); // Mock if needed, but repo usually exists
  
  const gameMetadataService = new GameMetadataService(gameMetadataRepo);
  const charEncyclopediaService = new CharacterEncyclopediaService(charEncyclopediaRepo);
  const characterService = new CharacterService(charRepo, gameRepo);
  
  const aiService = new AiService(
    process.env.GEMINI_API_KEY as string,
    process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    gameMetadataService,
    charEncyclopediaService
  );

  const analysisService = new AnalysisService(
    analysisRepo,
    aiService,
    gameMetadataService,
    charEncyclopediaService,
    characterService,
    vectorRepo,
    null as any, // notificationService
    null as any  // rivalRepo
  );

  // Fetch discovery matches
  const discovery = await analysisRepo.getDiscovery(15);
  console.log(`Found ${discovery.length} matches in discovery feed.`);

  for (const match of discovery) {
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
