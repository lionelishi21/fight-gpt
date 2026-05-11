import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

export class UserRoutes {
    private router: Router;

    constructor(private readonly userController: UserController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // All user routes are protected
        this.router.get('/me', authMiddleware, this.userController.getMe);
        this.router.patch('/slots/active', authMiddleware, this.userController.switchActiveSlot);
        this.router.patch('/slots/:index', authMiddleware, this.userController.updateSlot);
        this.router.post('/push-token', authMiddleware, this.userController.registerPushToken);
        this.router.get('/leaderboard', authMiddleware, this.userController.getLeaderboard);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default UserRoutes;
