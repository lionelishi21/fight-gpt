import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CharacterStructuralVectorRepository } from '../../repositories/CharacterStructuralVectorRepository';
import { CharacterPredictionService } from '../../services/CharacterPredictionService';

let mongoServer: MongoMemoryServer;
let repo: CharacterStructuralVectorRepository;

jest.setTimeout(60000);
process.env.MONGOMS_VERSION = '6.0.14';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => {
  repo = new CharacterStructuralVectorRepository();
});

afterEach(async () => {
  await mongoose.connection.collection('characterstructuralvectors').deleteMany({});
});

// Hand-built embeddings along orthogonal-ish axes so cosine similarity ranks
// deterministically without needing a real embedding model.
const GRAPPLER_VECTOR  = [1, 0, 0, 0];
const ZONER_VECTOR     = [0, 1, 0, 0];
const RUSHDOWN_VECTOR  = [0, 0, 1, 0];
const GRAPPLER_VECTOR_2 = [0.9, 0.1, 0, 0]; // close to grappler, not identical

describe('CharacterStructuralVectorRepository.findSimilarCharacters', () => {
  it('ranks a structurally similar character above unrelated archetypes', async () => {
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'zangief', isDraft: false, archetype: 'Grappler',
      kitDescriptionText: 'grappler kit', embedding: GRAPPLER_VECTOR, source: 'encyclopedia',
    });
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'guile', isDraft: false, archetype: 'Zoner',
      kitDescriptionText: 'zoner kit', embedding: ZONER_VECTOR, source: 'encyclopedia',
    });
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'ken', isDraft: false, archetype: 'Rushdown',
      kitDescriptionText: 'rushdown kit', embedding: RUSHDOWN_VECTOR, source: 'encyclopedia',
    });
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'marisa', isDraft: false, archetype: 'Grappler',
      kitDescriptionText: 'another grappler kit', embedding: GRAPPLER_VECTOR_2, source: 'encyclopedia',
    });

    // Query with a vector very close to the grappler axis — top results should be grapplers.
    const results = await repo.findSimilarCharacters([0.95, 0.05, 0, 0], 'sf6', 3);

    expect(results).toHaveLength(3);
    expect(results[0].character_id).toBe('zangief');
    expect(results[1].character_id).toBe('marisa');
    // The rushdown/zoner characters must rank below both grapplers
    expect(results[2].character_id).not.toBe('zangief');
    expect(results[2].character_id).not.toBe('marisa');
  });

  it('excludes draft characters from the searchable roster', async () => {
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'zangief', isDraft: false, archetype: 'Grappler',
      kitDescriptionText: 'grappler kit', embedding: GRAPPLER_VECTOR, source: 'encyclopedia',
    });
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'draft_grappler', isDraft: true, archetype: 'Grappler',
      kitDescriptionText: 'draft kit', embedding: GRAPPLER_VECTOR, source: 'draft_kit_input',
    });

    const results = await repo.findSimilarCharacters(GRAPPLER_VECTOR, 'sf6', 5);
    expect(results.map(r => r.character_id)).not.toContain('draft_grappler');
  });
});

describe('CharacterPredictionService', () => {
  it('returns analog matches hard-labeled as predicted_by_analogy with a disclaimer', async () => {
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'zangief', isDraft: false, archetype: 'Grappler',
      kitDescriptionText: 'grappler kit', embedding: GRAPPLER_VECTOR, source: 'encyclopedia',
    });
    await repo.upsertVector({
      gameId: 'sf6', characterId: 'guile', isDraft: false, archetype: 'Zoner',
      kitDescriptionText: 'zoner kit', embedding: ZONER_VECTOR, source: 'encyclopedia',
    });

    const generateEmbedding = jest.fn().mockResolvedValue([0.95, 0.05, 0, 0]);
    const service = new CharacterPredictionService(repo, generateEmbedding);

    const result = await service.predictUpcomingCharacterMatchups('sf6', {
      name: 'New Grappler',
      archetype: 'Grappler',
      moveset: { normals: [], specials: [{ name: 'Command Grab', input: '360', how_to_perform: '', category: 'special', properties: ['Command Grab', 'Armor'], frame_data: {} as any }], ex_moves: [], supers: [] },
    });

    expect(result.success).toBe(true);
    expect(result.data!.length).toBeGreaterThan(0);
    expect(result.data![0].character_id).toBe('zangief');
    for (const match of result.data!) {
      expect(match.predicted_by_analogy).toBe(true);
      expect(match.disclaimer).toMatch(/not derived from real match footage/i);
    }
  });
});
