"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const BaseController_1 = require("./BaseController");
const logger_1 = require("../helpers/logger");
class PaymentController extends BaseController_1.BaseController {
    paymentService;
    constructor(paymentService) {
        super();
        this.paymentService = paymentService;
    }
    /**
     * POST /api/payments/create-session
     */
    createSession = async (req, res) => {
        try {
            const { priceId } = req.body;
            const userId = req.user?.id;
            if (!priceId) {
                this.sendError(res, 'priceId is required', 400);
                return;
            }
            if (!userId) {
                this.sendError(res, 'Authentication required', 401);
                return;
            }
            const result = await this.paymentService.createCheckoutSession(userId, priceId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Controller failed');
        }
    };
    /**
     * POST /api/payments/webhook
     * This endpoint requires raw body for Stripe signature verification
     */
    webhook = async (req, res) => {
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            res.status(400).send('Webhook Error: No signature');
            return;
        }
        try {
            // Use the rawBody captured in index.ts for signature verification
            const payload = req.rawBody || req.body;
            const result = await this.paymentService.handleWebhook(payload, sig);
            if (result.success) {
                res.status(200).json({ received: true });
            }
            else {
                res.status(400).send(`Webhook Error: ${result.error}`);
            }
        }
        catch (error) {
            logger_1.Logger.error('Webhook controller error', error);
            res.status(500).send('Internal Server Error');
        }
    };
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=PaymentController.js.map