import FreeTierUsage from '../models/FreeTierUsage';

export interface QuotaResult {
    allowed: boolean;
    used: number;
    limit: number;
}

/** UTC day (2026-11-02) or ISO week (2026-W45) the usage counts toward. */
export function periodKey(period: 'day' | 'week', now = new Date()): string {
    if (period === 'day') return now.toISOString().split('T')[0];
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday decides the ISO year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Atomically use one of this period's `limit` uses for `key`. The update only matches
 * while count < limit; once the row is at the limit, the upsert hits the unique
 * (key, date) index and is refused, so concurrent requests can't overshoot.
 */
export async function consumeQuota(
    key: string,
    limit: number,
    feature: string,
    period: 'day' | 'week' = 'day',
): Promise<QuotaResult> {
    const date = periodKey(period);
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

export const consumeDailyQuota = (key: string, limit: number, feature: string) => consumeQuota(key, limit, feature, 'day');
