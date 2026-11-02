import User from '../models/User';
import XpEvent from '../models/XpEvent';
import { XpSource, levelForXp, rankForLevel } from '../helpers/progression';
import { Logger } from '../helpers/logger';

export interface XpAward {
    awarded: boolean;
    xp: number;
    level: number;
    rank: string;
    leveledUp: boolean;
    rankedUp: boolean;
}

/**
 * The one place XP is granted. Records the award in the ledger first, so the
 * same mission / analysis / referral can't pay out twice, then updates XP and
 * recomputes level and rank from the shared progression rules.
 */
export async function awardXp(userId: string, amount: number, source: XpSource, sourceId: string): Promise<XpAward | null> {
    try {
        await XpEvent.create({ user: userId, source, sourceId, amount });
    } catch (error: any) {
        if (error?.code === 11000) return null; // already awarded
        throw error;
    }

    const user = await User.findById(userId);
    if (!user) return null;

    const g: any = user.gamification || (user.gamification = {} as any);
    const before = { level: levelForXp(g.xp || 0), rank: rankForLevel(levelForXp(g.xp || 0)) };
    g.xp = (g.xp || 0) + amount;
    g.level = levelForXp(g.xp);
    g.rank = rankForLevel(g.level);
    user.markModified('gamification');
    await user.save();

    if (g.rank !== before.rank) Logger.info(`[XP] ${userId} ranked up to ${g.rank}`);
    return {
        awarded: true,
        xp: g.xp,
        level: g.level,
        rank: g.rank,
        leveledUp: g.level > before.level,
        rankedUp: g.rank !== before.rank,
    };
}
