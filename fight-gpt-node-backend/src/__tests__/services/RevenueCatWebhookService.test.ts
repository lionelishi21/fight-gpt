import { tierChangeForEvent, PRO_ENTITLEMENT } from '../../services/RevenueCatWebhookService';

const USER = '64b7f0c2a1b2c3d4e5f60718';
const OTHER = '64b7f0c2a1b2c3d4e5f60719';
const NOW = 1_800_000_000_000;

const event = (overrides: object) => ({
    type: 'INITIAL_PURCHASE',
    app_user_id: USER,
    entitlement_ids: [PRO_ENTITLEMENT],
    expiration_at_ms: NOW + 86_400_000,
    ...overrides,
});

describe('tierChangeForEvent', () => {
    it('grants on a purchase that expires in the future', () => {
        expect(tierChangeForEvent(event({}), NOW)).toEqual([{ userIds: [USER], grant: true }]);
    });

    it('grants on a lifetime purchase with no expiry', () => {
        const e = event({ type: 'NON_RENEWING_PURCHASE', expiration_at_ms: null });
        expect(tierChangeForEvent(e, NOW)).toEqual([{ userIds: [USER], grant: true }]);
    });

    it('keeps access after a cancellation until the period ends', () => {
        expect(tierChangeForEvent(event({ type: 'CANCELLATION' }), NOW)[0].grant).toBe(true);
    });

    it('revokes on expiration or a refund with a past expiry', () => {
        expect(tierChangeForEvent(event({ type: 'EXPIRATION', expiration_at_ms: NOW - 1 }), NOW)[0].grant).toBe(false);
        expect(tierChangeForEvent(event({ type: 'CANCELLATION', expiration_at_ms: NOW - 1 }), NOW)[0].grant).toBe(false);
    });

    it('ignores other entitlements, test events, and anonymous users', () => {
        expect(tierChangeForEvent(event({ entitlement_ids: ['something_else'] }), NOW)).toEqual([]);
        expect(tierChangeForEvent(event({ type: 'TEST' }), NOW)).toEqual([]);
        expect(tierChangeForEvent(event({ app_user_id: '$RCAnonymousID:abc' }), NOW)).toEqual([]);
    });

    it('matches the backend user through aliases', () => {
        const e = event({ app_user_id: '$RCAnonymousID:abc', aliases: ['$RCAnonymousID:abc', USER] });
        expect(tierChangeForEvent(e, NOW)).toEqual([{ userIds: [USER], grant: true }]);
    });

    it('moves access on a transfer', () => {
        const e = { type: 'TRANSFER', transferred_from: [OTHER], transferred_to: [USER] };
        expect(tierChangeForEvent(e, NOW)).toEqual([
            { userIds: [OTHER], grant: false },
            { userIds: [USER], grant: true },
        ]);
    });
});
