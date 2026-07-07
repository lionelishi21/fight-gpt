import { BaseRepository } from './BaseRepository';
import {
  IPlayerTendencyProfileDocument,
  PlayerTendencyProfile,
  TendencyOwnerType,
} from '../models/PlayerTendencyProfile';

export interface CountDeltas {
  moveDeltas: Record<string, number>;
  eventTypeDeltas: Record<string, number>;
  sequenceChains: string[][]; // observed chains this update — counts are merged/incremented
  sampleCountDelta: number;
}

export interface IPlayerTendencyRepository {
  findByOwnerAndCharacter(
    ownerType: TendencyOwnerType,
    ownerId: string,
    gameId: string,
    characterId: string,
  ): Promise<IPlayerTendencyProfileDocument | null>;

  upsertCounts(
    ownerType: TendencyOwnerType,
    ownerId: string,
    gameId: string,
    characterId: string,
    deltas: CountDeltas,
  ): Promise<IPlayerTendencyProfileDocument>;

  updateTendencyVector(
    profileKey: string,
    vector: number[],
    summaryText: string,
    sampleCountAtEmbed: number,
  ): Promise<void>;
}

function buildProfileKey(ownerType: TendencyOwnerType, ownerId: string, gameId: string, characterId: string): string {
  return `${ownerType}:${ownerId}:${gameId}:${characterId}`.toLowerCase();
}

const MAX_SEQUENCE_CHAINS = 25;

export class PlayerTendencyRepository extends BaseRepository<IPlayerTendencyProfileDocument> implements IPlayerTendencyRepository {
  constructor() {
    super(PlayerTendencyProfile);
  }

  public async findByOwnerAndCharacter(
    ownerType: TendencyOwnerType,
    ownerId: string,
    gameId: string,
    characterId: string,
  ): Promise<IPlayerTendencyProfileDocument | null> {
    const profileKey = buildProfileKey(ownerType, ownerId, gameId, characterId);
    return this.model.findOne({ profile_key: profileKey }).exec();
  }

  public async upsertCounts(
    ownerType: TendencyOwnerType,
    ownerId: string,
    gameId: string,
    characterId: string,
    deltas: CountDeltas,
  ): Promise<IPlayerTendencyProfileDocument> {
    const profileKey = buildProfileKey(ownerType, ownerId, gameId, characterId);

    const incFields: Record<string, number> = { sample_count: deltas.sampleCountDelta };
    for (const [move, delta] of Object.entries(deltas.moveDeltas)) {
      incFields[`move_frequency.${move}`] = delta;
    }
    for (const [eventType, delta] of Object.entries(deltas.eventTypeDeltas)) {
      incFields[`event_type_frequency.${eventType}`] = delta;
    }

    let doc: any = await this.model.findOneAndUpdate(
      { profile_key: profileKey },
      {
        $inc: incFields,
        $setOnInsert: {
          profile_key: profileKey,
          owner_type: ownerType,
          owner_id: ownerId,
          game_id: gameId,
          character_id: characterId,
        },
      },
      { upsert: true, new: true },
    ).exec();

    if (deltas.sequenceChains.length > 0 && doc) {
      doc = await this.mergeSequenceChains(doc, deltas.sequenceChains);
    }

    return doc as IPlayerTendencyProfileDocument;
  }

  private async mergeSequenceChains(
    doc: any,
    observedChains: string[][],
  ): Promise<any> {
    const counts = new Map<string, { chain: string[]; count: number }>();
    for (const existing of doc.favored_sequence_chains || []) {
      counts.set(existing.chain.join('>'), { chain: existing.chain, count: existing.count });
    }
    for (const chain of observedChains) {
      if (!chain?.length) continue;
      const key = chain.join('>');
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { chain, count: 1 });
    }

    const ranked = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, MAX_SEQUENCE_CHAINS);

    doc.favored_sequence_chains = ranked;
    await doc.save();
    return doc;
  }

  public async updateTendencyVector(
    profileKey: string,
    vector: number[],
    summaryText: string,
    sampleCountAtEmbed: number,
  ): Promise<void> {
    await this.model.updateOne(
      { profile_key: profileKey },
      {
        $set: {
          tendency_vector: vector,
          tendency_summary_text: summaryText,
          embedded_at_sample_count: sampleCountAtEmbed,
        },
      },
    ).exec();
  }
}

export default PlayerTendencyRepository;
