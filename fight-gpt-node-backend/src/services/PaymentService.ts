import Stripe from 'stripe';
import { AppConfig } from '../config/app';
import User from '../models/User';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
import { Logger } from '../helpers/logger';

export interface IPaymentService {
    createCheckoutSession(userId: string, priceId: string): Promise<ApiResponse<{ url: string }>>;
    handleWebhook(payload: any, sig: string): Promise<ApiResponse<boolean>>;
}

export class PaymentService extends BaseService implements IPaymentService {
    private stripe: InstanceType<typeof Stripe>;

    constructor() {
        super();
        this.stripe = new Stripe(AppConfig.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16' as any,
        });
    }

    async createCheckoutSession(userId: string, priceId: string): Promise<ApiResponse<{ url: string }>> {
        try {
            const user = await User.findById(userId);
            if (!user) return { success: false, error: 'User not found' };

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
                success_url: `${AppConfig.APP_URL}/dashboard?payment=success`,
                cancel_url: `${AppConfig.APP_URL}/dashboard?payment=cancelled`,
                metadata: {
                    userId: userId,
                },
            });

            return { success: true, data: { url: session.url as string } };
        } catch (error) {
            Logger.error('Stripe session creation failed', error);
            return { success: false, error: error instanceof Error ? error.message : 'Payment initialization failed' };
        }
    }

    async handleWebhook(payload: any, sig: string): Promise<ApiResponse<boolean>> {
        let event: any;

        try {
            event = this.stripe.webhooks.constructEvent(
                payload,
                sig,
                AppConfig.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            Logger.error('Webhook signature verification failed', err);
            return { success: false, error: 'Invalid signature' };
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as any;
                    const userId = session.client_reference_id || session.metadata?.userId;

                    if (userId) {
                        await User.findByIdAndUpdate(userId, {
                            tier: 'pro',
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: session.subscription as string,
                        });
                        Logger.info(`User ${userId} upgraded to PRO via Stripe`);
                    }
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as any;
                    await User.findOneAndUpdate(
                        { stripeSubscriptionId: subscription.id },
                        { tier: 'free' }
                    );
                    Logger.info(`Subscription ${subscription.id} cancelled. User downgraded to free.`);
                    break;
                }
            }

            return { success: true, data: true };
        } catch (error) {
            Logger.error('Webhook processing failed', error);
            return { success: false, error: 'Internal processing error' };
        }
    }
}
