import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

// Tight limit for registration — 5 signups per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many registration attempts. Try again in an hour.' },
    skip: () => process.env.NODE_ENV === 'development',
});

export class AuthRoutes {
    private router: Router;
    private authController: AuthController;

    constructor() {
        this.router = Router();
        this.authController = new AuthController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Public routes
        this.router.post('/register', registerLimiter, this.authController.register);
        this.router.post('/login', this.authController.login);

        // Protected routes
        this.router.get('/me', authMiddleware, this.authController.getMe);
        this.router.put('/profile', authMiddleware, this.authController.updateProfile);
        this.router.put('/preferences', authMiddleware, this.authController.updatePreferences);

        // Internal route — called by Stripe webhook (protected by INTERNAL_WEBHOOK_SECRET)
        this.router.post('/internal/update-tier', this.authController.updateTierFromStripe);
    }

    public getRouter(): Router {
        return this.router;
    }
}
