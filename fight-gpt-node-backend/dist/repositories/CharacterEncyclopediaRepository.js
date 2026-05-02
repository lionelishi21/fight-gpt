"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterEncyclopediaRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const CharacterEncyclopedia_1 = require("../models/CharacterEncyclopedia");
/**
 * Character Encyclopedia repository implementation
 * Follows Single Responsibility Principle - handles only character encyclopedia data operations
 * Follows Dependency Inversion Principle - depends on BaseRepository abstraction
 */
class CharacterEncyclopediaRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(CharacterEncyclopedia_1.CharacterEncyclopedia);
    }
    /**
     * Find character encyclopedia by game_id and character_id
     */
    async findByGameIdAndCharacterId(gameId, characterId) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            const normalizedCharacterId = characterId.toLowerCase().trim();
            return await this.findOne({
                game_id: normalizedGameId,
                character_id: normalizedCharacterId,
            });
        }
        catch (error) {
            throw this.handleError(error, 'findByGameIdAndCharacterId');
        }
    }
    /**
     * Find current character encyclopedia by game_id and character_id
     * Returns encyclopedia where is_current_patch is true
     */
    async findCurrentByGameIdAndCharacterId(gameId, characterId) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            const normalizedCharacterId = characterId.toLowerCase().trim();
            return await this.findOne({
                game_id: normalizedGameId,
                character_id: normalizedCharacterId,
                is_current_patch: true,
            });
        }
        catch (error) {
            throw this.handleError(error, 'findCurrentByGameIdAndCharacterId');
        }
    }
    /**
     * Find character encyclopedia by game_id, character_id, and patch_version
     */
    async findByGameIdAndCharacterIdAndVersion(gameId, characterId, version) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            const normalizedCharacterId = characterId.toLowerCase().trim();
            return await this.findOne({
                game_id: normalizedGameId,
                character_id: normalizedCharacterId,
                patch_version: version.trim(),
            });
        }
        catch (error) {
            throw this.handleError(error, 'findByGameIdAndCharacterIdAndVersion');
        }
    }
    /**
     * Find all character encyclopedias by game_id
     */
    async findByGameId(gameId) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            return await this.findMany({ game_id: normalizedGameId }, { sort: { character_id: 1, patch_version: -1 } });
        }
        catch (error) {
            throw this.handleError(error, 'findByGameId');
        }
    }
    /**
     * Create new character encyclopedia
     */
    async createEncyclopedia(data) {
        try {
            // Normalize game_id and character_id to lowercase
            const normalizedData = {
                ...data,
                game_id: data.game_id.toLowerCase().trim(),
                character_id: data.character_id.toLowerCase().trim(),
                is_current_patch: data.is_current_patch !== undefined ? data.is_current_patch : true,
            };
            return await this.create(normalizedData);
        }
        catch (error) {
            throw this.handleError(error, 'createEncyclopedia');
        }
    }
    /**
     * Update character encyclopedia by MongoDB ID
     */
    async updateEncyclopedia(id, data) {
        try {
            // Normalize game_id and character_id if provided
            const updateData = { ...data };
            if (updateData.game_id) {
                updateData.game_id = updateData.game_id.toLowerCase().trim();
            }
            if (updateData.character_id) {
                updateData.character_id = updateData.character_id.toLowerCase().trim();
            }
            return await this.update(id, updateData);
        }
        catch (error) {
            throw this.handleError(error, 'updateEncyclopedia');
        }
    }
    /**
     * Update character encyclopedia by game_id and character_id
     */
    async updateEncyclopediaByGameAndCharacter(gameId, characterId, data) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            const normalizedCharacterId = characterId.toLowerCase().trim();
            // Normalize game_id and character_id if provided in update data
            const updateData = { ...data };
            if (updateData.game_id) {
                updateData.game_id = updateData.game_id.toLowerCase().trim();
            }
            if (updateData.character_id) {
                updateData.character_id = updateData.character_id.toLowerCase().trim();
            }
            // Use findOneAndUpdate to update by game_id and character_id
            return await this.model
                .findOneAndUpdate({ game_id: normalizedGameId, character_id: normalizedCharacterId }, updateData, { new: true })
                .exec();
        }
        catch (error) {
            throw this.handleError(error, 'updateEncyclopediaByGameAndCharacter');
        }
    }
    /**
     * Create a new patch version for a character encyclopedia.
     * Marks all existing docs for this game+character as is_current_patch: false,
     * then creates a new doc with the new patch version copying the current moveset/rules/videos.
     */
    async bumpPatchVersion(gameId, characterId, newPatchVersion) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            const normalizedCharId = characterId.toLowerCase().trim();
            // Get current data to carry forward as baseline for new patch
            const current = await this.model.findOne({
                game_id: normalizedGameId,
                character_id: normalizedCharId,
                is_current_patch: true,
            }).lean().exec();
            // Mark all existing docs as not current
            await this.model.updateMany({ game_id: normalizedGameId, character_id: normalizedCharId }, { $set: { is_current_patch: false } }).exec();
            // Create new doc for the new patch, carrying moveset/rules/videos from current
            const newDoc = await this.create({
                game_id: normalizedGameId,
                character_id: normalizedCharId,
                patch_version: newPatchVersion,
                is_current_patch: true,
                moveset: current?.moveset ?? { normals: [], specials: [], ex_moves: [], supers: [] },
                game_rules: current?.game_rules ?? [],
                videos: current?.videos ?? [],
                version: current?.version ?? '1.0',
            });
            return newDoc;
        }
        catch (error) {
            throw this.handleError(error, 'bumpPatchVersion');
        }
    }
}
exports.CharacterEncyclopediaRepository = CharacterEncyclopediaRepository;
//# sourceMappingURL=CharacterEncyclopediaRepository.js.map