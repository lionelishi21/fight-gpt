import { BaseRepository } from './BaseRepository';
import { ICharacterDocument } from '../models/Character';
import { CreateCharacterRequest, UpdateCharacterRequest, CharacterFilters } from '../types/character';
/**
 * Character repository interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterRepository {
    findByGameId(gameId: string): Promise<ICharacterDocument[]>;
    findById(id: string): Promise<ICharacterDocument | null>;
    findByGameIdAndName(gameId: string, name: string): Promise<ICharacterDocument[]>;
    findCurrentCharactersByGame(gameId: string): Promise<ICharacterDocument[]>;
    findByGameIdAndVersion(gameId: string, version: string): Promise<ICharacterDocument[]>;
    findCurrentCharacterByGameAndName(gameId: string, name: string): Promise<ICharacterDocument | null>;
    createCharacter(data: CreateCharacterRequest): Promise<ICharacterDocument>;
    updateCharacter(id: string, data: UpdateCharacterRequest): Promise<ICharacterDocument | null>;
    searchCharacters(query: string, gameId?: string): Promise<ICharacterDocument[]>;
    findWithFilters(filters: CharacterFilters, limit?: number): Promise<ICharacterDocument[]>;
    exists(filter: object): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    /** Returns all lowercase name variants (name + aliases) for a game's current roster. */
    getNamesByGame(gameId: string): Promise<string[]>;
}
/**
 * Character repository implementation
 * Follows Single Responsibility Principle - handles only character data operations
 */
export declare class CharacterRepository extends BaseRepository<ICharacterDocument> implements ICharacterRepository {
    constructor();
    /**
     * Find all characters by game ID
     */
    findByGameId(gameId: string): Promise<ICharacterDocument[]>;
    /**
     * Find characters by game ID and name
     */
    findByGameIdAndName(gameId: string, name: string): Promise<ICharacterDocument[]>;
    /**
     * Find current characters by game
     */
    findCurrentCharactersByGame(gameId: string): Promise<ICharacterDocument[]>;
    /**
     * Find characters by game ID and version
     */
    findByGameIdAndVersion(gameId: string, version: string): Promise<ICharacterDocument[]>;
    /**
     * Find current character by game and name
     */
    findCurrentCharacterByGameAndName(gameId: string, name: string): Promise<ICharacterDocument | null>;
    /**
     * Create new character
     */
    createCharacter(data: CreateCharacterRequest): Promise<ICharacterDocument>;
    /**
     * Update character by ID
     */
    updateCharacter(id: string, data: UpdateCharacterRequest): Promise<ICharacterDocument | null>;
    /**
     * Search characters by text query
     */
    searchCharacters(query: string, gameId?: string): Promise<ICharacterDocument[]>;
    /**
     * Find characters with filters
     */
    findWithFilters(filters: CharacterFilters, limit?: number): Promise<ICharacterDocument[]>;
    /**
     * Returns all lowercase name variants (name + aliases) for the current patch
     * roster of a game. Used by MetaService to extract character names from
     * AI-generated scenario text without hardcoded lists.
     */
    getNamesByGame(gameId: string): Promise<string[]>;
}
//# sourceMappingURL=CharacterRepository.d.ts.map