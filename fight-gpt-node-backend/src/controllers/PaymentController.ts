import { Request, Response } from 'express';
import { IPaymentService } from '../services/PaymentService';
import { BaseController } from './BaseController';
import { applyRevenueCatEvent } from '../services/RevenueCatWebhookService';

export class PaymentController extends BaseController {
    constructor(private readonly paymentService: IPaymentService) {
        super();
    }

    createSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const { plan } = req.body as { plan?: 'competitor' | 'pro' };
            const userId = (req as any).user?.id;

            if (!userId) {
                this.sendError(res, 'Authentication required', 401);
                return;
            }

            if (!plan || !['competitor', 'pro'].includes(plan)) {
                this.sendError(res, 'plan must be "competitor" or "pro"', 400);
                return;
            }

            const result = await this.paymentService.createCheckoutSession(userId, plan);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /** POST /payments/revenuecat/webhook — keeps user.tier in step with in-app purchases */
    revenuecatWebhook = async (req: Request, res: Response): Promise<void> => {
        const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
        if (!expected) {
            this.sendError(res, 'RevenueCat webhook not configured', 500);
            return;
        }
        if (req.headers.authorization !== expected) {
            this.sendError(res, 'Unauthorized', 401);
            return;
        }

        const event = req.body?.event;
        if (!event?.type) {
            this.sendError(res, 'Missing event', 400);
            return;
        }

        try {
            await applyRevenueCatEvent(event);
            res.json({ received: true });
        } catch (error) {
            // A non-2xx makes RevenueCat retry the delivery
            this.sendError(res, error instanceof Error ? error.message : 'Webhook failed');
        }
    };
}
