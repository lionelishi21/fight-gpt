import { BaseRepository } from './BaseRepository';
import { ITheoryDocumentDocument, TheoryDoc } from '../models/TheoryDocument';

export interface ITheoryRepository {
    upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    getCharacterTheory(gameId: string, characterId: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getMatchupTheory(gameId: string, charA: string, charB: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getTheoryById(id: string): Promise<ITheoryDocumentDocument | null>;
}

export class TheoryRepository extends BaseRepository<ITheoryDocumentDocument> implements ITheoryRepository {
    constructor() {
        super(TheoryDoc);
    }

    async upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument> {
        // Mark previous theories for this character AND skill level as not current
        await this.model.updateMany(
            { game_id: data.game_id, character_id: data.character_id, target_skill_level: data.target_skill_level, type: 'character' },
            { $set: { is_current_patch: false } }
        ).exec();
        const result = await this.model.findOneAndUpdate(
            { game_id: data.game_id, character_id: data.character_id, target_skill_level: data.target_skill_level, type: 'character', patch_version: data.patch_version },
            { $set: { ...data, is_current_patch: true } },
            { upsert: true, new: true }
        ).exec();
        return result as unknown as ITheoryDocumentDocument;
    }

    async upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument> {
        const [charA, charB] = [data.character_a!, data.character_b!].sort();
        // Mark previous theories for this matchup AND skill level as not current
        await this.model.updateMany(
            { game_id: data.game_id, character_a: charA, character_b: charB, target_skill_level: data.target_skill_level, type: 'matchup' },
            { $set: { is_current_patch: false } }
        ).exec();
        const result = await this.model.findOneAndUpdate(
            { game_id: data.game_id, character_a: charA, character_b: charB, target_skill_level: data.target_skill_level, type: 'matchup', patch_version: data.patch_version },
            { $set: { ...data, character_a: charA, character_b: charB, is_current_patch: true } },
            { upsert: true, new: true }
        ).exec();
        return result as unknown as ITheoryDocumentDocument;
    }

    async getCharacterTheory(gameId: string, characterId: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null> {
        const filter: any = { game_id: gameId, character_id: characterId, type: 'character' };
        if (skillLevel) filter.target_skill_level = skillLevel;
        
        return this.model.findOne({ ...filter, is_current_patch: true }).exec()
            ?? this.model.findOne(filter).sort({ generated_at: -1 }).exec();
    }

    async getMatchupTheory(gameId: string, charA: string, charB: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null> {
        const [a, b] = [charA, charB].sort();
        const filter: any = { game_id: gameId, character_a: a, character_b: b, type: 'matchup' };
        if (skillLevel) filter.target_skill_level = skillLevel;

        return this.model.findOne({ ...filter, is_current_patch: true }).exec()
            ?? this.model.findOne(filter).sort({ generated_at: -1 }).exec();
    }

    async getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]> {
        return this.model.find({ game_id: gameId, type: 'character' }).sort({ generated_at: -1 }).exec();
    }

    async getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]> {
        return this.model.find({ game_id: gameId, type: 'matchup' }).sort({ generated_at: -1 }).exec();
    }
    
    async getTheoryById(id: string): Promise<ITheoryDocumentDocument | null> {
        return this.model.findOne({ theory_id: id }).exec();
    }
}
