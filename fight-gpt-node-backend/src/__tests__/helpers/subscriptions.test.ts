import { periodFromProductId, subscriptionFromRevenueCat, subscriberSource, summarizeSubscribers } from '../../helpers/subscriptions';

describe('periodFromProductId', () => {
    it('reads the period from store product ids', () => {
        expect(periodFromProductId('pro:yearly')).toBe('yearly');
        expect(periodFromProductId('pro_monthly')).toBe('monthly');
        expect(periodFromProductId('pro:monthly')).toBe('monthly');
        expect(periodFromProductId('lifetime')).toBeUndefined();
    });
});

describe('subscriptionFromRevenueCat', () => {
    const now = new Date('2026-11-04T00:00:00Z');
    const purchase = {
        type: 'INITIAL_PURCHASE', store: 'PLAY_STORE', product_id: 'pro:yearly',
        purchased_at_ms: Date.parse('2026-11-01'), expiration_at_ms: Date.parse('2027-11-01'),
        environment: 'PRODUCTION' as const,
    };

    it('records store, plan and renewal from a purchase', () => {
        const s = subscriptionFromRevenueCat(purchase, null, now);
        expect(s).toMatchObject({ source: 'play_store', period: 'yearly', willRenew: true, sandbox: false });
        expect(s.renewsAt?.toISOString()).toBe('2027-11-01T00:00:00.000Z');
        expect(s.startedAt?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    });

    it('marks a cancellation as not renewing and keeps the start date', () => {
        const first = subscriptionFromRevenueCat(purchase, null, now);
        const s = subscriptionFromRevenueCat({ type: 'CANCELLATION', store: 'PLAY_STORE', product_id: 'pro:yearly', purchased_at_ms: Date.parse('2026-12-01') }, first, now);
        expect(s.willRenew).toBe(false);
        expect(s.startedAt).toEqual(first.startedAt);
    });

    it('records website purchases made through Paddle, reading the plan from the billing length', () => {
        const paddle = { ...purchase, store: 'PADDLE', product_id: 'pri_01m6ka520ch0skgmzakn0ywdrt' };
        expect(subscriptionFromRevenueCat(paddle, null, now)).toMatchObject({ source: 'paddle', period: 'yearly' });
        const monthly = { ...paddle, expiration_at_ms: Date.parse('2026-12-01') };
        expect(subscriptionFromRevenueCat(monthly, null, now).period).toBe('monthly');
    });

    it('flags sandbox purchases', () => {
        expect(subscriptionFromRevenueCat({ ...purchase, environment: 'SANDBOX' }, null, now).sandbox).toBe(true);
    });
});

describe('summarizeSubscribers', () => {
    it('counts sources and plans and estimates MRR without sandbox or unknown plans', () => {
        const sum = summarizeSubscribers([
            { tier: 'PRO', subscription: { source: 'play_store', period: 'monthly' } },
            { tier: 'PRO', subscription: { source: 'app_store', period: 'yearly', willRenew: false } },
            { tier: 'PRO', subscription: { source: 'play_store', period: 'monthly', sandbox: true } },
            { tier: 'PRO', stripeSubscriptionId: 'I-123' },
            { tier: 'COMPETITOR' },
        ]);
        expect(sum).toMatchObject({ total: 5, paying: 4, sandbox: 1, cancelling: 1 });
        expect(sum.bySource).toEqual({ play_store: 2, app_store: 1, paypal: 1, manual: 1 });
        expect(sum.byPeriod).toEqual({ monthly: 1, yearly: 1, unknown: 2 });
        expect(sum.estimatedMrr).toBe(16.66);
    });

    it('labels in-app subscribers from before plans were recorded', () => {
        expect(subscriberSource({ tierSource: 'revenuecat' })).toBe('app');
    });
});
