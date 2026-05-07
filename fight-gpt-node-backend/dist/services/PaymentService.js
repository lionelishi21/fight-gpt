"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const app_1 = require("../config/app");
const User_1 = __importDefault(require("../models/User"));
const BaseService_1 = require("./BaseService");
const logger_1 = require("../helpers/logger");
class PaymentService extends BaseService_1.BaseService {
    stripe;
    constructor() {
        super();
        this.stripe = new stripe_1.default(app_1.AppConfig.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });
    }
    async createCheckoutSession(userId, priceId) {
        try {
            const user = await User_1.default.findById(userId);
            if (!user)
                return { success: false, error: 'User not found' };
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                customer_email: user.email,
                client_reference_id: userId,
                success_url: `${app_1.AppConfig.APP_URL}/dashboard?payment=success`,
                cancel_url: `${app_1.AppConfig.APP_URL}/dashboard?payment=cancelled`,
                metadata: {
                    userId: userId,
                },
            });
            return { success: true, data: { url: session.url } };
        }
        catch (error) {
            logger_1.Logger.error('Stripe session creation failed', error);
            return { success: false, error: error instanceof Error ? error.message : 'Payment initialization failed' };
        }
    }
    async handleWebhook(payload, sig) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, sig, app_1.AppConfig.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            logger_1.Logger.error('Webhook signature verification failed', err);
            return { success: false, error: 'Invalid signature' };
        }
        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    const userId = session.client_reference_id || session.metadata?.userId;
                    if (userId) {
                        await User_1.default.findByIdAndUpdate(userId, {
                            tier: 'PRO',
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                        });
                        logger_1.Logger.info(`User ${userId} upgraded to PRO via Stripe`);
                    }
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object;
                    await User_1.default.findOneAndUpdate({ stripeSubscriptionId: subscription.id }, { tier: 'FREE' });
                    logger_1.Logger.info(`Subscription ${subscription.id} cancelled. User downgraded to free.`);
                    break;
                }
            }
            return { success: true, data: true };
        }
        catch (error) {
            logger_1.Logger.error('Webhook processing failed', error);
            return { success: false, error: 'Internal processing error' };
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map