"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMetadataRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const GameMetadata_1 = require("../models/GameMetadata");
/**
 * Game Metadata repository implementation
 * Follows Single Responsibility Principle - handles only game metadata data operations
 * Follows Dependency Inversion Principle - depends on BaseRepository abstraction
 */
class GameMetadataRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(GameMetadata_1.GameMetadata);
    }
    /**
     * Find game metadata by game_id
     */
    async findByGameId(gameId) {
        try {
            return await this.findOne({ game_id: gameId.toLowerCase().trim() });
        }
        catch (error) {
            throw this.handleError(error, 'findByGameId');
        }
    }
    /**
     * Find current game metadata by game_id
     * Returns metadata where is_current is true
     */
    async findCurrentByGameId(gameId) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            return await this.findOne({ game_id: normalizedGameId, is_current: true });
        }
        catch (error) {
            throw this.handleError(error, 'findCurrentByGameId');
        }
    }
    /**
     * Find game metadata by game_id and patch_version
     */
    async findByGameIdAndVersion(gameId, version) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            return await this.findOne({
                game_id: normalizedGameId,
                patch_version: version.trim(),
            });
        }
        catch (error) {
            throw this.handleError(error, 'findByGameIdAndVersion');
        }
    }
    /**
     * Create new game metadata
     */
    async createGameMetadata(data) {
        try {
            // Normalize game_id to lowercase
            const normalizedData = {
                ...data,
                game_id: data.game_id.toLowerCase().trim(),
                is_current: data.is_current !== undefined ? data.is_current : true,
            };
            return await this.create(normalizedData);
        }
        catch (error) {
            throw this.handleError(error, 'createGameMetadata');
        }
    }
    /**
     * Update game metadata by MongoDB ID
     */
    async updateGameMetadata(id, data) {
        try {
            return await this.update(id, data);
        }
        catch (error) {
            throw this.handleError(error, 'updateGameMetadata');
        }
    }
    /**
     * Update game metadata by game_id
     */
    async updateGameMetadataByGameId(gameId, data) {
        try {
            const normalizedGameId = gameId.toLowerCase().trim();
            // Use findOneAndUpdate to update by game_id
            const updated = await this.model
                .findOneAndUpdate({ game_id: normalizedGameId }, data, { new: true })
                .exec();
            if (!updated) {
                return null;
            }
            return updated;
        }
        catch (error) {
            throw this.handleError(error, 'updateGameMetadataByGameId');
        }
    }
    /**
     * Find all active games (where is_current is true)
     */
    async findActiveGames() {
        try {
            return await this.findMany({ is_current: true });
        }
        catch (error) {
            throw this.handleError(error, 'findActiveGames');
        }
    }
}
exports.GameMetadataRepository = GameMetadataRepository;
//# sourceMappingURL=GameMetadataRepository.js.map