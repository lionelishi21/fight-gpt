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
    }

    public getRouter(): Router {
        return this.router;
    }
}
