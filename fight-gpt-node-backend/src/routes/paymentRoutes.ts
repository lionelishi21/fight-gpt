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
        // Webhook is handled by the Next.js frontend (Lemon Squeezy)
        // In-app purchases (RevenueCat) — authenticated by the shared Authorization header
        this.router.post('/revenuecat/webhook', this.paymentController.revenuecatWebhook);
    }

    public getRouter(): Router {
        return this.router;
    }
}
