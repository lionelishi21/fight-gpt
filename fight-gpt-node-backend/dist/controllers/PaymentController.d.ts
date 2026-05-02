import { Request, Response } from 'express';
import { IPaymentService } from '../services/PaymentService';
import { BaseController } from './BaseController';
export declare class PaymentController extends BaseController {
    private readonly paymentService;
    constructor(paymentService: IPaymentService);
    /**
     * POST /api/payments/create-session
     */
    createSession: (req: Request, res: Response) => Promise<void>;
    /**
     * POST /api/payments/webhook
     * This endpoint requires raw body for Stripe signature verification
     */
    webhook: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=PaymentController.d.ts.map