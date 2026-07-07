import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PlayerTendencyRepository } from '../../repositories/PlayerTendencyRepository';

let mongoServer: MongoMemoryServer;
let repo: PlayerTendencyRepository;

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
  repo = new PlayerTendencyRepository();
});

afterEach(async () => {
  await mongoose.connection.collection('playertendencyprofiles').deleteMany({});
});

describe('PlayerTendencyRepository', () => {
  it('creates a new profile on first upsert and accumulates counts across calls', async () => {
    await repo.upsertCounts('user', 'user-1', 'sf6', 'zangief', {
      moveDeltas: { lariat: 2, spd: 1 },
      eventTypeDeltas: { spacing_control: 2, punish_landed: 1 },
      sequenceChains: [['cr.mk', 'spd']],
      sampleCountDelta: 3,
    });

    const profile = await repo.upsertCounts('user', 'user-1', 'sf6', 'zangief', {
      moveDeltas: { lariat: 1 },
      eventTypeDeltas: { spacing_control: 1 },
      sequenceChains: [['cr.mk', 'spd']],
      sampleCountDelta: 1,
    });

    expect(profile.sample_count).toBe(4);
    expect(profile.move_frequency.lariat).toBe(3);
    expect(profile.move_frequency.spd).toBe(1);
    expect(profile.event_type_frequency.spacing_control).toBe(3);
    // Same chain observed twice across the two calls — count should merge, not duplicate entries
    expect(profile.favored_sequence_chains).toHaveLength(1);
    expect(profile.favored_sequence_chains[0].count).toBe(2);
  });

  it('findByOwnerAndCharacter returns null for an unknown profile and the doc once created', async () => {
    const missing = await repo.findByOwnerAndCharacter('user', 'user-2', 'sf6', 'ryu');
    expect(missing).toBeNull();

    await repo.upsertCounts('user', 'user-2', 'sf6', 'ryu', {
      moveDeltas: { hadoken: 1 },
      eventTypeDeltas: {},
      sequenceChains: [],
      sampleCountDelta: 1,
    });

    const found = await repo.findByOwnerAndCharacter('user', 'user-2', 'sf6', 'ryu');
    expect(found).not.toBeNull();
    expect(found!.move_frequency.hadoken).toBe(1);
  });

  it('updateTendencyVector sets the vector and bumps embedded_at_sample_count', async () => {
    const profile = await repo.upsertCounts('user', 'user-3', 'sf6', 'akuma', {
      moveDeltas: { gohadoken: 5 },
      eventTypeDeltas: {},
      sequenceChains: [],
      sampleCountDelta: 5,
    });

    await repo.updateTendencyVector(profile.profile_key, [0.1, 0.2, 0.3], 'akuma player favors gohadoken', 5);

    const updated = await repo.findByOwnerAndCharacter('user', 'user-3', 'sf6', 'akuma');
    expect(updated!.tendency_vector).toEqual([0.1, 0.2, 0.3]);
    expect(updated!.embedded_at_sample_count).toBe(5);
  });
});
