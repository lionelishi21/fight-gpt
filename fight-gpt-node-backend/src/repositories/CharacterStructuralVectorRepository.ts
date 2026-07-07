import { BaseRepository } from './BaseRepository';
import {
  CharacterStructuralVector,
  ICharacterStructuralVectorDocument,
} from '../models/CharacterStructuralVector';

export interface RankedCharacterMatch {
  character_id: string;
  archetype?: string;
  similarity_score: number;
}

export interface ICharacterStructuralVectorRepository {
  upsertVector(data: {
    gameId: string;
    characterId: string;
    isDraft: boolean;
    archetype?: string;
    kitDescriptionText: string;
    embedding: number[];
    source: 'encyclopedia' | 'draft_kit_input';
  }): Promise<ICharacterStructuralVectorDocument>;

  findSimilarCharacters(vector: number[], gameId: string, limit?: number): Promise<RankedCharacterMatch[]>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class CharacterStructuralVectorRepository
  extends BaseRepository<ICharacterStructuralVectorDocument>
  implements ICharacterStructuralVectorRepository {
  constructor() {
    super(CharacterStructuralVector);
  }

  public async upsertVector(data: {
    gameId: string;
    characterId: string;
    isDraft: boolean;
    archetype?: string;
    kitDescriptionText: string;
    embedding: number[];
    source: 'encyclopedia' | 'draft_kit_input';
  }): Promise<ICharacterStructuralVectorDocument> {
    const doc = await this.model.findOneAndUpdate(
      { game_id: data.gameId, character_id: data.characterId, is_draft: data.isDraft },
      {
        $set: {
          archetype: data.archetype,
          kit_description_text: data.kitDescriptionText,
          embedding: data.embedding,
          source: data.source,
        },
      },
      { upsert: true, new: true },
    ).exec();
    return doc as ICharacterStructuralVectorDocument;
  }

  /**
   * Brute-force cosine similarity over the game's roster, ranked in application code
   * rather than via Atlas $vectorSearch. Rosters are small (dozens of characters per
   * game), so this avoids requiring a separate Atlas vector index for a collection
   * this size, and keeps the feature fully testable without an Atlas-backed DB.
   */
  public async findSimilarCharacters(vector: number[], gameId: string, limit: number = 5): Promise<RankedCharacterMatch[]> {
    const candidates = await this.model.find({ game_id: gameId, is_draft: false }).lean().exec();

    return candidates
      .map((c: any) => ({
        character_id: c.character_id,
        archetype: c.archetype,
        similarity_score: cosineSimilarity(vector, c.embedding || []),
      }))
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  }
}

export default CharacterStructuralVectorRepository;
