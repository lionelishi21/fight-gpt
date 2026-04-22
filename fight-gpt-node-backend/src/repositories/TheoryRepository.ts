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
        // Mark previous theories for this character as not current
        await this.model.updateMany(
            { game_id: data.game_id, character_id: data.character_id, type: 'character' },
            { $set: { is_current_patch: false } }
        ).exec();
        return this.model.findOneAndUpdate(
            { game_id: data.game_id, character_id: data.character_id, type: 'character', patch_version: data.patch_version },
            { $set: { ...data, is_current_patch: true } },
            { upsert: true, new: true }
        ).exec() as Promise<ITheoryDocumentDocument>;
    }

    async upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument> {
        const [charA, charB] = [data.character_a!, data.character_b!].sort();
        // Mark previous theories for this matchup as not current
        await this.model.updateMany(
            { game_id: data.game_id, character_a: charA, character_b: charB, type: 'matchup' },
            { $set: { is_current_patch: false } }
        ).exec();
        return this.model.findOneAndUpdate(
            { game_id: data.game_id, character_a: charA, character_b: charB, type: 'matchup', patch_version: data.patch_version },
            { $set: { ...data, character_a: charA, character_b: charB, is_current_patch: true } },
            { upsert: true, new: true }
        ).exec() as Promise<ITheoryDocumentDocument>;
    }

    async getCharacterTheory(gameId: string, characterId: string): Promise<ITheoryDocumentDocument | null> {
        return this.model.findOne({ game_id: gameId, character_id: characterId, type: 'character', is_current_patch: true }).exec()
            ?? this.model.findOne({ game_id: gameId, character_id: characterId, type: 'character' }).sort({ generated_at: -1 }).exec();
    }

    async getMatchupTheory(gameId: string, charA: string, charB: string): Promise<ITheoryDocumentDocument | null> {
        const [a, b] = [charA, charB].sort();
        return this.model.findOne({ game_id: gameId, character_a: a, character_b: b, type: 'matchup', is_current_patch: true }).exec()
            ?? this.model.findOne({ game_id: gameId, character_a: a, character_b: b, type: 'matchup' }).sort({ generated_at: -1 }).exec();
    }

    async getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]> {
        return this.model.find({ game_id: gameId, type: 'character' }).sort({ generated_at: -1 }).exec();
    }

    async getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]> {
        return this.model.find({ game_id: gameId, type: 'matchup' }).sort({ generated_at: -1 }).exec();
    }
}
