import { Request, Response } from 'express';
import { IPaymentService } from '../services/PaymentService';
import { BaseController } from './BaseController';
import { Logger } from '../helpers/logger';
import { AppConfig } from '../config/app';

export class PaymentController extends BaseController {
    constructor(private readonly paymentService: IPaymentService) {
        super();
    }

    /**
     * POST /api/payments/create-session
     */
    createSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const { plan } = req.body as { plan?: 'competitor' | 'pro' };
            const userId = (req as any).user?.id;

            if (!userId) {
                this.sendError(res, 'Authentication required', 401);
                return;
            }

            const priceId = plan === 'competitor'
                ? AppConfig.STRIPE_COMPETITOR_PRICE_ID
                : AppConfig.STRIPE_PRO_PRICE_ID;

            if (!priceId) {
                this.sendError(res, `No Stripe price configured for plan: ${plan || 'pro'}`, 400);
                return;
            }

            const result = await this.paymentService.createCheckoutSession(userId, priceId, plan || 'pro');
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };

    /**
     * POST /api/payments/webhook
     * This endpoint requires raw body for Stripe signature verification
     */
    webhook = async (req: Request, res: Response): Promise<void> => {
        const sig = req.headers['stripe-signature'];
        
        if (!sig) {
            res.status(400).send('Webhook Error: No signature');
            return;
        }

        try {
            // Use the rawBody captured in index.ts for signature verification
            const payload = (req as any).rawBody || req.body;
            const result = await this.paymentService.handleWebhook(payload, sig as string);
            
            if (result.success) {
                res.status(200).json({ received: true });
            } else {
                res.status(400).send(`Webhook Error: ${result.error}`);
            }
        } catch (error) {
            Logger.error('Webhook controller error', error);
            res.status(500).send('Internal Server Error');
        }
    };
}
