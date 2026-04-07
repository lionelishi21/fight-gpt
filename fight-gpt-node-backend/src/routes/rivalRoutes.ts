import { Router } from 'express';
import { RivalController } from '../controllers/RivalController';
import { authMiddleware } from '../middleware/auth';

export class RivalRoutes {
    private router: Router;

    constructor(private readonly rivalController: RivalController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/', authMiddleware, this.rivalController.getRivals);
        this.router.post('/', authMiddleware, this.rivalController.addRival);
        this.router.delete('/:id', authMiddleware, this.rivalController.deleteRival);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default RivalRoutes;
