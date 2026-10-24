import mongoose from 'mongoose';
import User from '../models/User';
import UserGame from '../models/UserGame';
import { Logger } from '../helpers/logger';

/** RevenueCat entitlement that unlocks paid features in the app. */
export const PRO_ENTITLEMENT = 'metapunish_pro';

/** Backend tier granted while the entitlement is active. */
export const ENTITLED_TIER = 'PRO' as const;

export interface RevenueCatEvent {
    type: string;
    app_user_id?: string;
    original_app_user_id?: string;
    aliases?: string[];
    entitlement_ids?: string[] | null;
    expiration_at_ms?: number | null;
    transferred_from?: string[];
    transferred_to?: string[];
    environment?: 'SANDBOX' | 'PRODUCTION';
}

export type TierChange = { userIds: string[]; grant: boolean };

/**
 * The app logs in to RevenueCat with the backend user id, so any id that
 * isn't an ObjectId (e.g. $RCAnonymousID:...) can't be matched to a user.
 */
function backendUserIds(ids: (string | undefined)[]): string[] {
    return [...new Set(ids.filter((id): id is string => !!id && mongoose.isValidObjectId(id)))];
}

/**
 * Works out what an event means for the user's tier. Rather than branching on
 * every event type, it follows the entitlement's expiry: a lifetime purchase
 * has none, a cancelled-but-paid-up subscription expires in the future, and
 * EXPIRATION or a refund carries an expiry in the past.
 */
export function tierChangeForEvent(event: RevenueCatEvent, now = Date.now()): TierChange[] {
    if (event.type === 'TEST') return [];

    if (event.type === 'TRANSFER') {
        return [
            { userIds: backendUserIds(event.transferred_from ?? []), grant: false },
            { userIds: backendUserIds(event.transferred_to ?? []), grant: true },
        ].filter(c => c.userIds.length > 0);
    }

    if (!event.entitlement_ids?.includes(PRO_ENTITLEMENT)) return [];

    const userIds = backendUserIds([event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])]);
    if (userIds.length === 0) return [];

    const expiresAt = event.expiration_at_ms;
    const grant = expiresAt == null || expiresAt > now;
    return [{ userIds, grant }];
}

export async function applyRevenueCatEvent(event: RevenueCatEvent): Promise<void> {
    for (const { userIds, grant } of tierChangeForEvent(event)) {
        const users = await User.find({ _id: { $in: userIds } });
        for (const user of users) {
            if (grant) {
                user.tier = ENTITLED_TIER;
                user.tierSource = 'revenuecat';
            } else if (user.tierSource === 'revenuecat') {
                // Only take back what RevenueCat gave; leave web subscribers alone
                user.tier = 'FREE';
                user.tierSource = undefined;
            } else {
                continue;
            }
            await user.save();
            await UserGame.updateMany({ user: user._id }, { planType: grant ? 'premium' : 'free' });
            Logger.info(`[RevenueCat] ${event.type} (${event.environment}) → ${user._id} tier ${user.tier}`);
        }
    }
}
