import { BaseRepository } from './BaseRepository';
import { ITheoryDocumentDocument, TheoryDoc } from '../models/TheoryDocument';

export interface ITheoryRepository {
    upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    getCharacterTheory(gameId: string, characterId: string): Promise<ITheoryDocumentDocument | null>;
    getMatchupTheory(gameId: string, charA: string, charB: string): Promise<ITheoryDocumentDocument | null>;
    getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
}

export class TheoryRepository extends BaseRepository<ITheoryDocumentDocument> implements ITheoryRepository {
    constructor() {
        super(TheoryDoc);
    }

    async upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument> {
        return this.model.findOneAndUpdate(
            { game_id: data.game_id, character_id: data.character_id, type: 'character' },
            { $set: data },
            { upsert: true, new: true }
        ).exec() as Promise<ITheoryDocumentDocument>;
    }

    async upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument> {
        // Normalise order so A|B and B|A resolve to the same doc
        const [charA, charB] = [data.character_a!, data.character_b!].sort();
        return this.model.findOneAndUpdate(
            { game_id: data.game_id, character_a: charA, character_b: charB, type: 'matchup' },
            { $set: { ...data, character_a: charA, character_b: charB } },
            { upsert: true, new: true }
        ).exec() as Promise<ITheoryDocumentDocument>;
    }

    async getCharacterTheory(gameId: string, characterId: string): Promise<ITheoryDocumentDocument | null> {
        return this.model.findOne({ game_id: gameId, character_id: characterId, type: 'character' }).exec();
    }

    async getMatchupTheory(gameId: string, charA: string, charB: string): Promise<ITheoryDocumentDocument | null> {
        const [a, b] = [charA, charB].sort();
        return this.model.findOne({ game_id: gameId, character_a: a, character_b: b, type: 'matchup' }).exec();
    }

    async getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]> {
        return this.model.find({ game_id: gameId, type: 'character' }).sort({ generated_at: -1 }).exec();
    }

    async getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]> {
        return this.model.find({ game_id: gameId, type: 'matchup' }).sort({ generated_at: -1 }).exec();
    }
}
