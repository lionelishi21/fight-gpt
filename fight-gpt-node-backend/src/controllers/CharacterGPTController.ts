import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ICharacterGPTService } from '../services/CharacterGPTService';
import { ChatMessage } from '../services/ChatService';

export class CharacterGPTController extends BaseController {
    constructor(private readonly characterGPTService: ICharacterGPTService) {
        super();
    }

    /**
     * POST /character-gpt/:gameId/:characterId/chat
     * Body: { message: string, history?: ChatMessage[] }
     * 
     * Chat with a character-specific AI coach. The character's persona,
     * frame data, and game knowledge are injected into the prompt.
     */
    public chat = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId, characterId } = req.params;
            const { message, history } = req.body as {
                message: string;
                history?: ChatMessage[];
            };

            if (!message || message.trim().length === 0) {
                this.sendError(res, 'message is required', 400);
                return;
            }

            if (!gameId || !characterId) {
                this.sendError(res, 'gameId and characterId are required in URL', 400);
                return;
            }

            // Get user context
            // @ts-ignore - user is attached by auth middleware
            const user = req.user;
            const userId = user?.id || 'anonymous';

            // Determine premium status from user tier
            const userTier = user?.tier || 'FREE';
            const isPremium = userTier !== 'FREE' || user?.role === 'admin';

            // Determine skill level from user profile
            const skillLevel = user?.preferences?.skillLevel || 'intermediate';

            const result = await this.characterGPTService.chat(
                gameId,
                characterId,
                message,
                history || [],
                skillLevel,
                isPremium,
            );

            this.sendResponse(res, {
                success: result.success,
                data: {
                    message: result.message,
                    character: result.character,
                    persona_voice: result.persona_voice,
                    requires_upgrade: result.requires_upgrade,
                },
                error: result.error,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Character GPT failed', 500);
        }
    };

    /**
     * GET /character-gpt/:gameId/available
     * 
     * Returns all characters available as AI coaches for a game,
     * including their persona voice and greeting message.
     */
    public getAvailable = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                this.sendError(res, 'gameId is required', 400);
                return;
            }

            const characters = await this.characterGPTService.getAvailableCharacters(gameId);

            this.sendResponse(res, {
                success: true,
                data: {
                    game_id: gameId,
                    characters,
                    total: characters.length,
                    available: characters.filter(c => c.is_available).length,
                },
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to list characters', 500);
        }
    };
}
