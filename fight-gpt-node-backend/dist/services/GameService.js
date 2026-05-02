"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const BaseService_1 = require("./BaseService");
/**
 * Game service implementation
 * Follows Single Responsibility Principle - orchestrates game business logic
 * Follows Dependency Inversion Principle - depends on repository interface
 */
class GameService extends BaseService_1.BaseService {
    gameRepository;
    characterRepository;
    constructor(gameRepository, characterRepository) {
        super();
        this.gameRepository = gameRepository;
        this.characterRepository = characterRepository;
    }
    /**
     * Create new game
     */
    async createGame(request) {
        try {
            this.validateCreateRequest(request);
            // Check if game_id already exists
            const existing = await this.gameRepository.findByGameId(request.game_id);
            if (existing) {
                return {
                    success: false,
                    error: `Game with ID "${request.game_id}" already exists`,
                };
            }
            // Normalize game_id
            const normalizedRequest = {
                ...request,
                game_id: request.game_id.toLowerCase().trim(),
                is_active: request.is_active !== undefined ? request.is_active : true,
            };
            const game = await this.gameRepository.createGame(normalizedRequest);
            return {
                success: true,
                data: this.mapToGame(game),
                message: 'Game created successfully',
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
     * Get game by MongoDB ID
     */
    async getGameById(id) {
        try {
            const game = await this.gameRepository.findById(id);
            if (!game) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            return {
                success: true,
                data: this.mapToGame(game),
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
     * Get game by game_id
     */
    async getGameByGameId(gameId) {
        try {
            const game = await this.gameRepository.findByGameId(gameId);
            if (!game) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            return {
                success: true,
                data: this.mapToGame(game),
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
     * Update game by MongoDB ID
     */
    async updateGame(id, request) {
        try {
            const existing = await this.gameRepository.findById(id);
            if (!existing) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            // If updating game_id, check if new one already exists
            if (request.game_id && request.game_id !== existing.game_id) {
                const gameIdExists = await this.gameRepository.findByGameId(request.game_id);
                if (gameIdExists) {
                    return {
                        success: false,
                        error: `Game with ID "${request.game_id}" already exists`,
                    };
                }
            }
            const updated = await this.gameRepository.updateGame(id, request);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update game',
                };
            }
            return {
                success: true,
                data: this.mapToGame(updated),
                message: 'Game updated successfully',
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
     * Update game by game_id
     */
    async updateGameByGameId(gameId, request) {
        try {
            const existing = await this.gameRepository.findByGameId(gameId);
            if (!existing) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            // If updating game_id, check if new one already exists
            if (request.game_id && request.game_id !== existing.game_id) {
                const gameIdExists = await this.gameRepository.findByGameId(request.game_id);
                if (gameIdExists) {
                    return {
                        success: false,
                        error: `Game with ID "${request.game_id}" already exists`,
                    };
                }
            }
            const updated = await this.gameRepository.updateGameByGameId(gameId, request);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update game',
                };
            }
            return {
                success: true,
                data: this.mapToGame(updated),
                message: 'Game updated successfully',
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
     * Delete game
     */
    async deleteGame(id) {
        try {
            const game = await this.gameRepository.findById(id);
            if (!game) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            // Check if game has characters
            const characters = await this.characterRepository.findByGameId(game.game_id);
            if (characters.length > 0) {
                return {
                    success: false,
                    error: `Cannot delete game. It has ${characters.length} character(s) associated with it.`,
                };
            }
            const deleted = await this.gameRepository.delete(id);
            return {
                success: deleted,
                data: deleted,
                message: deleted ? 'Game deleted successfully' : 'Failed to delete game',
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
     * Get all active games (for onboarding)
     */
    async getActiveGames() {
        try {
            const games = await this.gameRepository.findActiveGames();
            return {
                success: true,
                data: games.map((game) => this.mapToGame(game)),
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
     * Find games with filters
     */
    async findGames(filters, limit) {
        try {
            const games = await this.gameRepository.findWithFilters(filters, limit);
            return {
                success: true,
                data: games.map((game) => this.mapToGame(game)),
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
     * Search games
     */
    async searchGames(query) {
        try {
            if (!query || query.trim().length === 0) {
                return {
                    success: false,
                    error: 'Search query is required',
                };
            }
            const games = await this.gameRepository.searchGames(query);
            return {
                success: true,
                data: games.map((game) => this.mapToGame(game)),
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
     * Activate game
     */
    async activateGame(id) {
        try {
            const updated = await this.gameRepository.updateGame(id, { is_active: true });
            if (!updated) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            return {
                success: true,
                data: this.mapToGame(updated),
                message: 'Game activated successfully',
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
     * Deactivate game
     */
    async deactivateGame(id) {
        try {
            const updated = await this.gameRepository.updateGame(id, { is_active: false });
            if (!updated) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            return {
                success: true,
                data: this.mapToGame(updated),
                message: 'Game deactivated successfully',
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
     * Refresh character count for a game
     */
    async refreshCharacterCount(gameId) {
        try {
            const game = await this.gameRepository.findByGameId(gameId);
            if (!game) {
                return {
                    success: false,
                    error: 'Game not found',
                };
            }
            // Count current characters for this game
            const currentCharacters = await this.characterRepository.findCurrentCharactersByGame(gameId);
            const count = currentCharacters.length;
            // Update character count using refresh method
            const updated = await this.gameRepository.refreshCharacterCount(gameId, count);
            if (!updated) {
                return {
                    success: false,
                    error: 'Failed to update character count',
                };
            }
            return {
                success: true,
                data: this.mapToGame(updated),
                message: `Character count refreshed to ${count}`,
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
        if (!request.name || request.name.trim().length === 0) {
            throw new Error('name is required');
        }
        // Validate game_id format (alphanumeric and underscores only)
        const gameIdRegex = /^[a-z0-9_]+$/;
        if (!gameIdRegex.test(request.game_id.toLowerCase())) {
            throw new Error('game_id must contain only lowercase letters, numbers, and underscores');
        }
    }
    /**
     * Map document to game interface
     */
    mapToGame(document) {
        return {
            _id: document._id.toString(),
            game_id: document.game_id,
            name: document.name,
            full_name: document.full_name,
            publisher: document.publisher,
            developer: document.developer,
            release_date: document.release_date,
            genre: document.genre,
            platform: document.platform,
            icon_url: document.icon_url,
            banner_url: document.banner_url,
            description: document.description,
            is_active: document.is_active,
            supported_characters_count: document.supported_characters_count,
            latest_version: document.latest_version,
            created_at: document.created_at,
            updated_at: document.updated_at,
        };
    }
}
exports.GameService = GameService;
//# sourceMappingURL=GameService.js.map