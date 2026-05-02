import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
export declare class PaymentRoutes {
    private readonly paymentController;
    private router;
    constructor(paymentController: PaymentController);
    private setupRoutes;
    getRouter(): Router;
}
//# sourceMappingURL=paymentRoutes.d.ts.map