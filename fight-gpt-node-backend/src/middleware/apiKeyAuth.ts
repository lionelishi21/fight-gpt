import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiKey, RATE_LIMITS } from '../models/ApiKey';

/**
 * Validates `Authorization: Bearer mp_live_xxx` and enforces per-hour rate limits.
 * Attaches `req.apiKey` for downstream handlers.
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization || '';
    const raw = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!raw.startsWith('mp_live_')) {
        res.status(401).json({ success: false, error: 'Missing or invalid API key. Use: Authorization: Bearer mp_live_...' });
        return;
    }

    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const apiKey = await ApiKey.findOne({ keyHash: hash, isActive: true });

    if (!apiKey) {
        res.status(401).json({ success: false, error: 'Invalid API key.' });
        return;
    }

    // Rolling hourly rate limit
    const now      = new Date();
    const windowMs = 60 * 60 * 1000;
    const limit    = RATE_LIMITS[apiKey.tier] ?? 100;

    if (now.getTime() - apiKey.hourWindowStart.getTime() > windowMs) {
        apiKey.requestsThisHour = 0;
        apiKey.hourWindowStart  = now;
    }

    if (apiKey.requestsThisHour >= limit) {
        res.status(429).json({
            success: false,
            error:   `Rate limit exceeded. ${limit} requests/hour on ${apiKey.tier} tier. Resets at ${new Date(apiKey.hourWindowStart.getTime() + windowMs).toISOString()}.`,
            retryAfter: Math.ceil((apiKey.hourWindowStart.getTime() + windowMs - now.getTime()) / 1000),
        });
        return;
    }

    apiKey.requestsThisHour++;
    apiKey.lastUsedAt = now;
    apiKey.save().catch(() => {});  // fire-and-forget

    (req as any).apiKey = apiKey;
    next();
}
