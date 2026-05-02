"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterEncyclopediaService = void 0;
const BaseService_1 = require("./BaseService");
/**
 * Character Encyclopedia service implementation
 * Follows Single Responsibility Principle - orchestrates character encyclopedia business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
class CharacterEncyclopediaService extends BaseService_1.BaseService {
    characterEncyclopediaRepository;
    constructor(characterEncyclopediaRepository) {
        super();
        this.characterEncyclopediaRepository = characterEncyclopediaRepository;
    }
    /**
     * Create new character encyclopedia
     */
    async createEncyclopedia(request) {
        try {
            this.validateCreateRequest(request);
            // Check if encyclopedia already exists for this game/character/version combination
            const existing = await this.characterEncyclopediaRepository.findByGameIdAndCharacterIdAndVersion(request.game_id, request.character_id, request.patch_version);
            if (existing) {
                return {
                    success: false,
                    error: `Encyclopedia for game "${request.game_id}", character "${request.character_id}", and version "${request.patch_version}" already exists`,
                };
            }
            // Normalize game_id and character_id
            const normalizedRequest = {
                ...request,
                game_id: request.game_id.toLowerCase().trim(),
                character_id: request.character_id.toLowerCase().trim(),
                is_current_patch: request.is_current_patch !== undefined ? request.is_current_patch : true,
            };
            const encyclopedia = await this.characterEncyclopediaRepository.createEncyclopedia(normalizedRequest);
            return {
                success: true,
                data: this.mapToCharacterEncyclopedia(encyclopedia),
                message: 'Character encyclopedia created successfully',
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Get character encyclopedia by MongoDB ID
     */
    async getEncyclopediaById(id) {
        try {
            const encyclopedia = await this.characterEncyclopediaRepository.findById(id);
            if (!encyclopedia) {
                return {
                    success: false,
                    error: 'Character encyclopedia not found',
                };
            }
            return {
                success: true,
                data: this.mapToCharacterEncyclopedia(encyclopedia),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Get character encyclopedia by game_id and character_id
     */
    async getEncyclopediaByGameAndCharacter(gameId, characterId) {
        try {
            const encyclopedia = await this.characterEncyclopediaRepository.findByGameIdAndCharacterId(gameId, characterId);
            if (!encyclopedia) {
                return {
                    success: false,
                    error: 'Character encyclopedia not found',
                };
            }
            return {
                success: true,
                data: this.mapToCharacterEncyclopedia(encyclopedia),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Get current character encyclopedia by game_id and character_id (for AI service)
     */
    async getCurrentEncyclopediaByGameAndCharacter(gameId, characterId) {
        try {
            const encyclopedia = await this.characterEncyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, characterId);
            if (!encyclopedia) {
                return {
                    success: false,
                    error: 'Current character encyclopedia not found',
                };
            }
            return {
                success: true,
                data: this.mapToCharacterEncyclopedia(encyclopedia),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Get all character encyclopedias by game_id
     */
    async getEncyclopediasByGame(gameId) {
        try {
            const encyclopedias = await this.characterEncyclopediaRepository.findByGameId(gameId);
            return {
                success: true,
                data: encyclopedias.map((enc) => this.mapToCharacterEncyclopedia(enc)),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Update character encyclopedia by MongoDB ID
     */
    async updateEncyclopedia(id, request) {
        try {
            const existing = await this.characterEncyclopediaRepository.findById(id);
            if (!existing) {
                return {
                    success: false,
                    error: 'Character encyclopedia not found',
                };
            }
            const updated = await this.characterEncyclopediaRepository.updateEncyclopedia(id, request);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update character encyclopedia',
                };
            }
            return {
                success: true,
                data: this.mapToCharacterEncyclopedia(updated),
                message: 'Character encyclopedia updated successfully',
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Update character encyclopedia by game_id and character_id
     */
    async updateEncyclopediaByGameAndCharacter(gameId, characterId, request) {
        try {
            const existing = await this.characterEncyclopediaRepository.findByGameIdAndCharacterId(gameId, characterId);
            if (!existing) {
                return {
                    success: false,
                    error: 'Character encyclopedia not found',
                };
            }
            const updated = await this.characterEncyclopediaRepository.updateEncyclopediaByGameAndCharacter(gameId, characterId, request);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update character encyclopedia',
                };
            }
            return {
                success: true,
                data: this.mapToCharacterEncyclopedia(updated),
                message: 'Character encyclopedia updated successfully',
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Delete character encyclopedia
     */
    async deleteEncyclopedia(id) {
        try {
            const encyclopedia = await this.characterEncyclopediaRepository.findById(id);
            if (!encyclopedia) {
                return {
                    success: false,
                    error: 'Character encyclopedia not found',
                };
            }
            const deleted = await this.characterEncyclopediaRepository.delete(id);
            return {
                success: deleted,
                data: deleted,
                message: deleted ? 'Character encyclopedia deleted successfully' : 'Failed to delete character encyclopedia',
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Get game rules for a character (for AI service)
     * Extracts game_rules from the current encyclopedia
     */
    async getGameRules(gameId, characterId) {
        try {
            const encyclopedia = await this.characterEncyclopediaRepository.findCurrentByGameIdAndCharacterId(gameId, characterId);
            if (!encyclopedia) {
                return {
                    success: false,
                    error: 'Character encyclopedia not found',
                };
            }
            return {
                success: true,
                data: encyclopedia.game_rules || [],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Validate create request
     */
    validateCreateRequest(request) {
        if (!request.game_id || request.game_id.trim().length === 0) {
            throw new Error('game_id is required');
        }
        if (!request.character_id || request.character_id.trim().length === 0) {
            throw new Error('character_id is required');
        }
        if (!request.patch_version || request.patch_version.trim().length === 0) {
            throw new Error('patch_version is required');
        }
        if (!request.moveset || typeof request.moveset !== 'object') {
            throw new Error('moveset is required and must be an object');
        }
        if (!request.game_rules || !Array.isArray(request.game_rules)) {
            throw new Error('game_rules is required and must be an array');
        }
        // Validate moveset structure
        if (!request.moveset.normals || !Array.isArray(request.moveset.normals)) {
            throw new Error('moveset.normals is required and must be an array');
        }
        if (!request.moveset.specials || !Array.isArray(request.moveset.specials)) {
            throw new Error('moveset.specials is required and must be an array');
        }
        if (!request.moveset.ex_moves || !Array.isArray(request.moveset.ex_moves)) {
            throw new Error('moveset.ex_moves is required and must be an array');
        }
        if (!request.moveset.supers || !Array.isArray(request.moveset.supers)) {
            throw new Error('moveset.supers is required and must be an array');
        }
        // Validate game_rules array
        for (const rule of request.game_rules) {
            if (!rule.key || rule.key.trim().length === 0) {
                throw new Error('game_rules[].key is required');
            }
            if (!rule.ui_type || rule.ui_type.trim().length === 0) {
                throw new Error('game_rules[].ui_type is required');
            }
            if (rule.value === undefined || rule.value === null) {
                throw new Error('game_rules[].value is required');
            }
        }
    }
    /**
     * Map document to character encyclopedia interface
     */
    mapToCharacterEncyclopedia(document) {
        return {
            _id: document._id.toString(),
            game_id: document.game_id,
            character_id: document.character_id,
            patch_version: document.patch_version,
            is_current_patch: document.is_current_patch,
            moveset: document.moveset, // Type assertion needed due to MoveDocument vs Move type differences
            game_rules: document.game_rules,
            videos: document.videos, // Added videos mapping
            combos: document.combos, // Added combos mapping
            legacy_movesets: document.legacy_movesets, // Type assertion needed
            last_updated: document.last_updated,
            created_at: document.created_at,
            updated_at: document.updated_at,
        };
    }
}
exports.CharacterEncyclopediaService = CharacterEncyclopediaService;
//# sourceMappingURL=CharacterEncyclopediaService.js.map