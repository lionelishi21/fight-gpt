import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import User from '../models/User';
import UserGame from '../models/UserGame';
import { Game } from '../models/Game';
import { Character } from '../models/Character';

export class OnboardingController extends BaseController {
    /**
     * Complete onboarding step: save game and character selection
     */
    public completeOnboarding = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user is attached by middleware
            const userId = req.user.id;
            const { gameId, characterId, skillLevel, country, city } = req.body;

            // 1. Validate Game
            // Try finding by game_id string first (e.g. 'sf6')
            let game = await Game.findOne({ game_id: gameId });
            if (!game) {
                // Fallback to _id if provided
                if (gameId.match(/^[0-9a-fA-F]{24}$/)) {
                    game = await Game.findById(gameId);
                }
            }

            if (!game) {
                this.sendError(res, 'Game not found', 404);
                return;
            }

            // 2. Validate Character (if selected)
            let character = null;
            if (characterId) {
                character = await Character.findById(characterId);
                if (!character) {
                    this.sendError(res, 'Character not found', 404);
                    return;
                }
                // Ensure character belongs to game
                if (character.game_id.toString() !== game.game_id && character.game_id.toString() !== game._id.toString()) {
                    this.sendError(res, 'Character does not belong to the selected game', 400);
                    return;
                }
            }

            // 3. Enforce Free Tier Logic (1 Character per Game)
            // Check for existing active UserGame entries for this game
            const existingEntry = await UserGame.findOne({
                user: userId,
                game: game._id,
                isActive: true,
            });

            if (existingEntry) {
                // If they already have a character for this game, we update it
                // In a strict "1 character per game" model, this effectively replaces the choice
                existingEntry.character = character ? character._id : undefined;
                await existingEntry.save();
            } else {
                // Create new entry
                const userGame = new UserGame({
                    user: userId,
                    game: game._id,
                    character: character ? character._id : undefined,
                    planType: 'free',
                    isActive: true,
                });
                await userGame.save();
            }

            // 4. Update User Profile with V2 Slot Architecture
            const proficiencyMap: Record<string, 'newbie' | 'intermediate' | 'pro'> = {
                'beginner': 'newbie',
                'intermediate': 'intermediate',
                'advanced': 'pro',
                'pro': 'pro'
            };

            await User.findByIdAndUpdate(userId, {
                onboardingCompleted: true,
                tier: 'FREE',
                activeSlotIndex: 0,
                slots: [{
                    gameId: gameId,
                    characterId: characterId,
                    rank: 'Rookie',
                    notificationsEnabled: true,
                    proficiencyLevel: proficiencyMap[skillLevel] || 'newbie'
                }],
                $set: {
                    'preferences.skillLevel': skillLevel || 'beginner', // Backward compat
                    'location.country': country,
                    'location.city': city
                },
                $addToSet: { 'preferences.favoriteGames': gameId }
            });

            this.sendResponse(res, {
                success: true,
                message: 'Onboarding completed successfully with Slot 0 initialized',
            });

        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Onboarding failed', 500);
        }
    };
    
    /**
     * GET /api/onboarding/status
     * Check if user has initialized their first game/character slot
     */
    public getOnboardingStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const user = await User.findById(userId).select('onboardingCompleted');

            this.sendResponse(res, {
                success: true,
                data: {
                    initialized: user ? user.onboardingCompleted : false
                }
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch onboarding status', 500);
        }
    };
}
