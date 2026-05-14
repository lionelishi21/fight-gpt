import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import User from '../models/User';
import UserGame from '../models/UserGame';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { EmailService } from '../services/EmailService';

export class OnboardingController extends BaseController {
    private emailService = new EmailService();

    /**
     * Complete onboarding step: save game and character selection
     */
    public completeOnboarding = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore - user is attached by middleware
            const userId = req.user.id;
            const { gameId, characterId, skillLevel, goal, country, city } = req.body;

            // 1. Validate Game
            let game = await Game.findOne({ game_id: gameId });
            if (!game) {
                if (gameId?.match(/^[0-9a-fA-F]{24}$/)) {
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
            }

            // 3. Enforce Free Tier Logic (1 Character per Game)
            const existingEntry = await UserGame.findOne({
                user: userId,
                game: game._id,
                isActive: true,
            });

            if (existingEntry) {
                existingEntry.character = character ? character._id : undefined;
                await existingEntry.save();
            } else {
                const userGame = new UserGame({
                    user: userId,
                    game: game._id,
                    character: character ? character._id : undefined,
                    planType: 'free',
                    isActive: true,
                });
                await userGame.save();
            }

            // 4. Update User Profile
            const proficiencyMap: Record<string, 'newbie' | 'intermediate' | 'pro'> = {
                'beginner': 'newbie',
                'intermediate': 'intermediate',
                'advanced': 'pro',
                'pro': 'pro'
            };

            const user = await User.findById(userId);
            if (!user) {
                this.sendError(res, 'User not found', 404);
                return;
            }

            // Preservation logic: only set FREE if tier is default
            const newTier = user.tier === 'FREE' ? 'FREE' : user.tier;

            await User.findByIdAndUpdate(userId, {
                onboardingCompleted: true,
                tier: newTier,
                activeSlotIndex: 0,
                slots: [{
                    gameId: gameId,
                    characterId: characterId,
                    rank: 'Rookie',
                    notificationsEnabled: true,
                    proficiencyLevel: proficiencyMap[skillLevel] || 'newbie'
                }],
                $set: {
                    'preferences.skillLevel': skillLevel || 'beginner',
                    'preferences.goal': goal || 'rank_up',
                    'location.country': country,
                    'location.city': city
                },
                $addToSet: { 'preferences.favoriteGames': gameId }
            });

            this.sendResponse(res, {
                success: true,
                message: 'Onboarding completed successfully with Slot 0 initialized',
            });

            // 5. Send Welcome Email
            try {
                if (user && user.email) {
                    await this.emailService.sendWelcomeEmail(user.email, user.name || 'Fighter');
                }
            } catch (emailErr) {
                console.error('[OnboardingController] Welcome email failed:', emailErr);
            }

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
