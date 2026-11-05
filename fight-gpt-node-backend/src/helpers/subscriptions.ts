import { ISubscriptionInfo, SubscriptionSource } from '../models/User';

/** List prices, for an estimate of monthly recurring revenue on the admin subscriber page. */
export const LIST_PRICE = { monthly: 9.99, yearly: 79.99 } as const;

/** "pro:yearly", "pro_yearly", "metapunish_annual" → yearly; anything monthly → monthly. */
export function periodFromProductId(productId?: string | null): 'monthly' | 'yearly' | undefined {
    const id = (productId || '').toLowerCase();
    if (/year|annual|12m|p1y/.test(id)) return 'yearly';
    if (/month|1m\b|p1m/.test(id)) return 'monthly';
    return undefined;
}

/**
 * Paddle price ids (pri_…) say nothing about the period, so fall back to the length of the
 * billing period the event covers: anything over ~2 months is the yearly plan.
 */
function periodFromBillingLength(event: { purchased_at_ms?: number | null; expiration_at_ms?: number | null }): 'monthly' | 'yearly' | undefined {
    if (!event.purchased_at_ms || !event.expiration_at_ms) return undefined;
    const days = (event.expiration_at_ms - event.purchased_at_ms) / 86_400_000;
    if (days <= 0) return undefined;
    return days > 60 ? 'yearly' : 'monthly';
}

const STORE_SOURCE: Record<string, SubscriptionSource> = {
    APP_STORE: 'app_store',
    MAC_APP_STORE: 'app_store',
    PLAY_STORE: 'play_store',
    STRIPE: 'stripe',
    RC_BILLING: 'stripe',
    PADDLE: 'paddle',
    PROMOTIONAL: 'promotional',
};

export interface RevenueCatSubscriptionFields {
    type: string;
    store?: string;
    product_id?: string;
    purchased_at_ms?: number | null;
    expiration_at_ms?: number | null;
    environment?: 'SANDBOX' | 'PRODUCTION';
}

/** What a RevenueCat event says about the subscription, merged over what we already knew. */
export function subscriptionFromRevenueCat(
    event: RevenueCatSubscriptionFields,
    previous?: ISubscriptionInfo | null,
    now = new Date()
): ISubscriptionInfo {
    const productId = event.product_id || previous?.productId;
    let willRenew = previous?.willRenew ?? true;
    if (event.type === 'CANCELLATION') willRenew = false;
    if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'].includes(event.type)) willRenew = true;
    if (event.store === 'PROMOTIONAL') willRenew = false;

    return {
        source: (event.store && STORE_SOURCE[event.store]) || previous?.source || 'other',
        productId,
        period: periodFromProductId(productId) ?? periodFromBillingLength(event) ?? previous?.period,
        renewsAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : previous?.renewsAt,
        willRenew,
        startedAt: previous?.startedAt
            ?? (event.purchased_at_ms ? new Date(event.purchased_at_ms) : now),
        sandbox: event.environment === 'SANDBOX',
        updatedAt: now,
    };
}

type SubscriberLike = {
    tier?: string;
    tierSource?: string;
    stripeSubscriptionId?: string;
    subscription?: ISubscriptionInfo | null;
};

/** Where a paid account's access comes from, including accounts paid before we recorded it. */
export function subscriberSource(user: SubscriberLike): SubscriptionSource | 'app' | 'manual' {
    if (user.subscription?.source) return user.subscription.source;
    if (user.tierSource === 'revenuecat') return 'app';
    if (user.stripeSubscriptionId) return 'paypal';
    return 'manual';
}

export function summarizeSubscribers(users: SubscriberLike[]) {
    const bySource: Record<string, number> = {};
    const byPeriod = { monthly: 0, yearly: 0, unknown: 0 };
    let cancelling = 0;
    let sandbox = 0;
    let mrr = 0;

    for (const u of users) {
        const source = subscriberSource(u);
        bySource[source] = (bySource[source] || 0) + 1;
        if (u.subscription?.sandbox) { sandbox++; continue; }
        if (u.subscription?.willRenew === false) cancelling++;
        const period = u.subscription?.period;
        if (period === 'monthly') { byPeriod.monthly++; mrr += LIST_PRICE.monthly; }
        else if (period === 'yearly') { byPeriod.yearly++; mrr += LIST_PRICE.yearly / 12; }
        else byPeriod.unknown++;
    }

    return {
        total: users.length,
        paying: users.length - sandbox,
        sandbox,
        cancelling,
        bySource,
        byPeriod,
        /** Estimated from list prices; excludes sandbox testers and plans we don't know the period of */
        estimatedMrr: Math.round(mrr * 100) / 100,
    };
}
