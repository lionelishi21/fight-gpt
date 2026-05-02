import { BaseRepository } from './BaseRepository';
import { ICharacterEncyclopediaDocument } from '../models/CharacterEncyclopedia';
import { CreateCharacterEncyclopediaRequest, UpdateCharacterEncyclopediaRequest } from '../types/characterEncyclopedia';
/**
 * Character Encyclopedia repository interface
 * Follows Interface Segregation Principle
 */
export interface ICharacterEncyclopediaRepository {
    findById(id: string): Promise<ICharacterEncyclopediaDocument | null>;
    findByGameIdAndCharacterId(gameId: string, characterId: string): Promise<ICharacterEncyclopediaDocument | null>;
    findCurrentByGameIdAndCharacterId(gameId: string, characterId: string): Promise<ICharacterEncyclopediaDocument | null>;
    findByGameIdAndCharacterIdAndVersion(gameId: string, characterId: string, version: string): Promise<ICharacterEncyclopediaDocument | null>;
    findByGameId(gameId: string): Promise<ICharacterEncyclopediaDocument[]>;
    createEncyclopedia(data: CreateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument>;
    updateEncyclopedia(id: string, data: UpdateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument | null>;
    updateEncyclopediaByGameAndCharacter(gameId: string, characterId: string, data: UpdateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument | null>;
    bumpPatchVersion(gameId: string, characterId: string, newPatchVersion: string): Promise<ICharacterEncyclopediaDocument>;
    delete(id: string): Promise<boolean>;
}
/**
 * Character Encyclopedia repository implementation
 * Follows Single Responsibility Principle - handles only character encyclopedia data operations
 * Follows Dependency Inversion Principle - depends on BaseRepository abstraction
 */
export declare class CharacterEncyclopediaRepository extends BaseRepository<ICharacterEncyclopediaDocument> implements ICharacterEncyclopediaRepository {
    constructor();
    /**
     * Find character encyclopedia by game_id and character_id
     */
    findByGameIdAndCharacterId(gameId: string, characterId: string): Promise<ICharacterEncyclopediaDocument | null>;
    /**
     * Find current character encyclopedia by game_id and character_id
     * Returns encyclopedia where is_current_patch is true
     */
    findCurrentByGameIdAndCharacterId(gameId: string, characterId: string): Promise<ICharacterEncyclopediaDocument | null>;
    /**
     * Find character encyclopedia by game_id, character_id, and patch_version
     */
    findByGameIdAndCharacterIdAndVersion(gameId: string, characterId: string, version: string): Promise<ICharacterEncyclopediaDocument | null>;
    /**
     * Find all character encyclopedias by game_id
     */
    findByGameId(gameId: string): Promise<ICharacterEncyclopediaDocument[]>;
    /**
     * Create new character encyclopedia
     */
    createEncyclopedia(data: CreateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument>;
    /**
     * Update character encyclopedia by MongoDB ID
     */
    updateEncyclopedia(id: string, data: UpdateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument | null>;
    /**
     * Update character encyclopedia by game_id and character_id
     */
    updateEncyclopediaByGameAndCharacter(gameId: string, characterId: string, data: UpdateCharacterEncyclopediaRequest): Promise<ICharacterEncyclopediaDocument | null>;
    /**
     * Create a new patch version for a character encyclopedia.
     * Marks all existing docs for this game+character as is_current_patch: false,
     * then creates a new doc with the new patch version copying the current moveset/rules/videos.
     */
    bumpPatchVersion(gameId: string, characterId: string, newPatchVersion: string): Promise<ICharacterEncyclopediaDocument>;
}
//# sourceMappingURL=CharacterEncyclopediaRepository.d.ts.map