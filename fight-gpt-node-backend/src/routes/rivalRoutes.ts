import { Router } from 'express';
import { RivalController } from '../controllers/RivalController';
import { authMiddleware } from '../middleware/auth';

export class RivalRoutes {
    private router: Router;
    private controller: RivalController;

    constructor() {
        this.router = Router();
        this.controller = new RivalController();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/', authMiddleware, this.controller.getAll);
        this.router.post('/', authMiddleware, this.controller.add);
        this.router.delete('/:id', authMiddleware, this.controller.remove);
    }

    public getRouter(): Router {
        return this.router;
    }
}
