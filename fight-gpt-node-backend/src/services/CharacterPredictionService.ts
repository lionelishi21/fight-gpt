import { ApiResponse } from '../types';
import { Moveset } from '../types/characterEncyclopedia';
import { formatCharacterKitForEmbedding } from '../helpers/characterKitTextHelper';
import {
  ICharacterStructuralVectorRepository,
  RankedCharacterMatch,
} from '../repositories/CharacterStructuralVectorRepository';
import { BaseService } from './BaseService';

export interface DraftCharacterKit {
  name: string;
  archetype?: string;
  moveset: Partial<Moveset>;
}

export interface PredictedAnalog extends RankedCharacterMatch {
  predicted_by_analogy: true;
  disclaimer: string;
}

const DISCLAIMER =
  'This is a structural analogy prediction based on kit properties for an unreleased character — ' +
  'not derived from real match footage. Treat as a heuristic starting point, not verified theory.';

export interface ICharacterPredictionService {
  predictUpcomingCharacterMatchups(
    gameId: string,
    draftCharacterKit: DraftCharacterKit,
    limit?: number,
  ): Promise<ApiResponse<PredictedAnalog[]>>;
}

export class CharacterPredictionService extends BaseService implements ICharacterPredictionService {
  constructor(
    private readonly structuralVectorRepository: ICharacterStructuralVectorRepository,
    private readonly generateEmbedding: (text: string) => Promise<number[]>,
  ) {
    super();
  }

  async predictUpcomingCharacterMatchups(
    gameId: string,
    draftCharacterKit: DraftCharacterKit,
    limit: number = 3,
  ): Promise<ApiResponse<PredictedAnalog[]>> {
    try {
      const kitText = formatCharacterKitForEmbedding(draftCharacterKit.archetype, draftCharacterKit.moveset);
      const embedding = await this.generateEmbedding(kitText);
      if (!embedding?.length) {
        return { success: false, error: 'Failed to embed draft character kit' };
      }

      const matches = await this.structuralVectorRepository.findSimilarCharacters(embedding, gameId, limit);

      const predicted: PredictedAnalog[] = matches.map(m => ({
        ...m,
        predicted_by_analogy: true,
        disclaimer: DISCLAIMER,
      }));

      return { success: true, data: predicted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Character prediction failed',
      };
    }
  }
}

export default CharacterPredictionService;
