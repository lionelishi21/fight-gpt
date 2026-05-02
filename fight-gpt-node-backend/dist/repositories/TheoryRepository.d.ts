import { BaseRepository } from './BaseRepository';
import { ITheoryDocumentDocument } from '../models/TheoryDocument';
export interface ITheoryRepository {
    upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    getCharacterTheory(gameId: string, characterId: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getMatchupTheory(gameId: string, charA: string, charB: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
}
export declare class TheoryRepository extends BaseRepository<ITheoryDocumentDocument> implements ITheoryRepository {
    constructor();
    upsertCharacterTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    upsertMatchupTheory(data: Partial<ITheoryDocumentDocument>): Promise<ITheoryDocumentDocument>;
    getCharacterTheory(gameId: string, characterId: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getMatchupTheory(gameId: string, charA: string, charB: string, skillLevel?: string): Promise<ITheoryDocumentDocument | null>;
    getAllCharacterTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
    getAllMatchupTheories(gameId: string): Promise<ITheoryDocumentDocument[]>;
}
//# sourceMappingURL=TheoryRepository.d.ts.map