"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Character_1 = require("../models/Character");
/**
 * Character repository implementation
 * Follows Single Responsibility Principle - handles only character data operations
 */
class CharacterRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Character_1.Character);
    }
    /**
     * Find all characters by game ID
     */
    async findByGameId(gameId) {
        return this.findMany({ game_id: gameId }, { sort: { name: 1 } });
    }
    /**
     * Find characters by game ID and name
     */
    async findByGameIdAndName(gameId, name) {
        return this.findMany({ game_id: gameId, name }, { sort: { version: -1 } });
    }
    /**
     * Find current characters by game
     */
    async findCurrentCharactersByGame(gameId) {
        return this.findMany({ game_id: gameId, is_current: true }, { sort: { name: 1 } });
    }
    /**
     * Find characters by game ID and version
     */
    async findByGameIdAndVersion(gameId, version) {
        return this.findMany({ game_id: gameId, version }, { sort: { name: 1 } });
    }
    /**
     * Find current character by game and name
     */
    async findCurrentCharacterByGameAndName(gameId, name) {
        return this.findOne({ game_id: gameId, name, is_current: true });
    }
    /**
     * Create new character
     */
    async createCharacter(data) {
        return this.create(data);
    }
    /**
     * Update character by ID
     */
    async updateCharacter(id, data) {
        return this.update(id, data);
    }
    /**
     * Search characters by text query
     */
    async searchCharacters(query, gameId) {
        try {
            const searchFilter = { $text: { $search: query } };
            if (gameId) {
                searchFilter.game_id = gameId;
            }
            return this.findMany(searchFilter, { sort: { score: { $meta: 'textScore' } } });
        }
        catch (error) {
            // Fallback to regex search if text index is not available
            const regexFilter = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { patch_notes_summary: { $regex: query, $options: 'i' } },
                ],
            };
            if (gameId) {
                regexFilter.game_id = gameId;
            }
            return this.findMany(regexFilter, { sort: { name: 1 } });
        }
    }
    /**
     * Find characters with filters
     */
    async findWithFilters(filters, limit) {
        const query = {};
        if (filters.game_id) {
            query.game_id = filters.game_id;
        }
        if (filters.name) {
            query.name = filters.name;
        }
        if (filters.version) {
            query.version = filters.version;
        }
        if (filters.is_current !== undefined) {
            query.is_current = filters.is_current;
        }
        const options = {
            sort: { name: 1 },
        };
        if (limit) {
            options.limit = limit;
        }
        return this.findMany(query, options);
    }
}
exports.CharacterRepository = CharacterRepository;
//# sourceMappingURL=CharacterRepository.js.map