import { Request, Response } from 'express';
import { IPaymentService } from '../services/PaymentService';
import { BaseController } from './BaseController';

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
}
