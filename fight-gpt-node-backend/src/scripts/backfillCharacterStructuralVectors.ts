import dotenv from 'dotenv';
dotenv.config();

/**
 * One-off backfill: embeds every existing character's kit (archetype + move
 * properties from the encyclopedia, NOT match footage) into CharacterStructuralVector
 * so CharacterPredictionService has a roster to compare draft/unreleased kits against.
 *
 * Usage: npx tsx src/scripts/backfillCharacterStructuralVectors.ts [game_id]
 * game_id defaults to sf6.
 */

import { Database } from '../config/database';
import { AppConfig } from '../config/app';
import { AiService } from '../services/AiService';
import { GameMetadataService } from '../services/GameMetadataService';
import { CharacterEncyclopediaService } from '../services/CharacterEncyclopediaService';
import { GameMetadataRepository } from '../repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { CharacterStructuralVectorRepository } from '../repositories/CharacterStructuralVectorRepository';
import { Character } from '../models/Character';
import { formatCharacterKitForEmbedding } from '../helpers/characterKitTextHelper';

async function run() {
  const gameId = process.argv[2] || 'sf6';

  console.log(`--- BACKFILLING CHARACTER STRUCTURAL VECTORS: ${gameId} ---`);
  await Database.connect();

  const gameMetadataRepo = new GameMetadataRepository();
  const characterEncyclopediaRepo = new CharacterEncyclopediaRepository();
  const gameMetadataService = new GameMetadataService(gameMetadataRepo);
  const characterEncyclopediaService = new CharacterEncyclopediaService(characterEncyclopediaRepo);
  const structuralVectorRepo = new CharacterStructuralVectorRepository();

  const aiService = new AiService(
    AppConfig.GEMINI_API_KEY,
    AppConfig.GEMINI_MODEL,
    gameMetadataService,
    characterEncyclopediaService,
  );

  const encsResult = await characterEncyclopediaService.getEncyclopediasByGame(gameId);
  const encyclopedias = encsResult.success && encsResult.data ? encsResult.data : [];
  console.log(`Found ${encyclopedias.length} encyclopedia entries for ${gameId}.`);

  let processed = 0;
  for (const enc of encyclopedias) {
    try {
      // Best-effort archetype lookup — not required for the kit fingerprint to be useful.
      const characterDoc = await Character.findOne({
        game_id: gameId,
        name: { $regex: new RegExp(`^${enc.character_id}$`, 'i') },
      }).lean().exec();
      const archetype = (characterDoc as any)?.archetype;

      const kitText = formatCharacterKitForEmbedding(archetype, enc.moveset);
      const embedding = await aiService.generateEmbedding(kitText);

      if (!embedding?.length) {
        console.warn(`  ⚠ Skipping ${enc.character_id} — embedding failed`);
        continue;
      }

      await structuralVectorRepo.upsertVector({
        gameId,
        characterId: enc.character_id,
        isDraft: false,
        archetype,
        kitDescriptionText: kitText,
        embedding,
        source: 'encyclopedia',
      });

      processed++;
      console.log(`  ✓ ${enc.character_id} (${archetype || 'unknown archetype'})`);
    } catch (err) {
      console.error(`  ✗ ${enc.character_id} failed:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`--- DONE: ${processed}/${encyclopedias.length} characters vectorized ---`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
