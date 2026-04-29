import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/auth';

export class PaymentRoutes {
    private router: Router;

    constructor(private readonly paymentController: PaymentController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Create checkout session (Authenticated)
        this.router.post('/create-session', authMiddleware, this.paymentController.createSession);

        // Webhook (Public, but verified via Stripe signature)
        // IMPORTANT: Must be configured in index.ts with express.raw()
        this.router.post('/webhook', this.paymentController.webhook);
    }

    public getRouter(): Router {
        return this.router;
    }
}
