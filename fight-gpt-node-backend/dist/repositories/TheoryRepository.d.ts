import { BaseRepository } from './BaseRepository';
import { ITheoryDocumentDocument } from '../models/TheoryDocument';
export interface ITheoryRepository {
    upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    getCharacterTheory(gameId: string, characterId: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getMatchupTheory(gameId: string, charA: string, charB: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getTheoryById(id: string): Promise<ITheoryDocumentDocument | null>;
}
export declare class TheoryRepository extends BaseRepository<ITheoryDocumentDocument> implements ITheoryRepository {
    constructor();
    upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    getCharacterTheory(gameId: string, characterId: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getMatchupTheory(gameId: string, charA: string, charB: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getTheoryById(id: string): Promise<ITheoryDocumentDocument | null>;
}
//# sourceMappingURL=TheoryRepository.d.ts.map