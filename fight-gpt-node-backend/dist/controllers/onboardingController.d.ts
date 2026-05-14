import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class OnboardingController extends BaseController {
    private emailService;
    /**
     * Complete onboarding step: save game and character selection
     */
    completeOnboarding: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/onboarding/status
     * Check if user has initialized their first game/character slot
     */
    getOnboardingStatus: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=onboardingController.d.ts.map