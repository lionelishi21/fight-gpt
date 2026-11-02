import FreeTierUsage from '../models/FreeTierUsage';

export interface QuotaResult {
    allowed: boolean;
    used: number;
    limit: number;
}

/**
 * Atomically use one of today's `limit` uses for `key`. The update only matches while
 * count < limit; once the day's row is at the limit, the upsert hits the unique
 * (key, date) index and is refused, so concurrent requests can't overshoot.
 */
export async function consumeDailyQuota(key: string, limit: number, feature: string): Promise<QuotaResult> {
    const date = new Date().toISOString().split('T')[0];
    try {
        const row = await FreeTierUsage.findOneAndUpdate(
            { key, date, count: { $lt: limit } },
            { $inc: { count: 1 }, $setOnInsert: { character: feature } },
            { upsert: true, new: true }
        ).lean();
        return { allowed: true, used: row?.count ?? 1, limit };
    } catch (error: any) {
        if (error?.code === 11000) return { allowed: false, used: limit, limit };
        throw error;
    }
}
