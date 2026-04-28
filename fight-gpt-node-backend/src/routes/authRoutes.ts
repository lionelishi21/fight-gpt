import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

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
        this.router.post('/register', this.authController.register);
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
