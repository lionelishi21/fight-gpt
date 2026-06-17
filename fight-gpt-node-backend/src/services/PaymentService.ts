import User from '../models/User';
import { ApiResponse } from '../types';
import { BaseService } from './BaseService';
import { Logger } from '../helpers/logger';

const LS_API_KEY          = process.env.LEMONSQUEEZY_API_KEY          ?? '';
const LS_STORE_ID         = process.env.LEMONSQUEEZY_STORE_ID         ?? '';
const LS_COMPETITOR_VARIANT = process.env.LEMONSQUEEZY_COMPETITOR_VARIANT_ID ?? '';
const LS_PRO_VARIANT        = process.env.LEMONSQUEEZY_PRO_VARIANT_ID        ?? '';
const APP_URL             = process.env.APP_URL                        ?? 'https://metapunish.com';

export interface IPaymentService {
    createCheckoutSession(userId: string, plan: 'competitor' | 'pro'): Promise<ApiResponse<{ url: string }>>;
}

export class PaymentService extends BaseService implements IPaymentService {

    async createCheckoutSession(userId: string, plan: 'competitor' | 'pro'): Promise<ApiResponse<{ url: string }>> {
        try {
            const user = await User.findById(userId);
            if (!user) return { success: false, error: 'User not found' };

            if (!LS_API_KEY || !LS_STORE_ID) {
                return { success: false, error: 'Payment provider not configured' };
            }

            const variantId = plan === 'pro' ? LS_PRO_VARIANT : LS_COMPETITOR_VARIANT;
            if (!variantId) {
                return { success: false, error: `No variant configured for plan: ${plan}` };
            }

            const body = {
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email: user.email,
                            custom: {
                                user_id:    userId,
                                user_email: user.email,
                                plan,
                            },
                        },
                        checkout_options: {
                            success_url: `${APP_URL}/checkout/success`,
                        },
                    },
                    relationships: {
                        store:   { data: { type: 'stores',   id: String(LS_STORE_ID) } },
                        variant: { data: { type: 'variants', id: String(variantId)   } },
                    },
                },
            };

            const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
                method: 'POST',
                headers: {
                    Authorization:  `Bearer ${LS_API_KEY}`,
                    'Content-Type': 'application/vnd.api+json',
                    Accept:         'application/vnd.api+json',
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                Logger.error('Lemon Squeezy checkout error', data);
                return { success: false, error: 'Failed to create checkout session' };
            }

            const url = data?.data?.attributes?.url;
            if (!url) return { success: false, error: 'No checkout URL returned' };

            return { success: true, data: { url } };
        } catch (error) {
            Logger.error('Lemon Squeezy session creation failed', error);
            return { success: false, error: error instanceof Error ? error.message : 'Payment initialization failed' };
        }
    }
}
