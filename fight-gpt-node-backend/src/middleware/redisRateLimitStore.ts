import IORedis from 'ioredis';
import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';

/**
 * Redis-backed store for express-rate-limit v7.
 * Uses ioredis with INCR + PTTL in a pipeline — single round-trip per request.
 * Survives server restarts and works across multiple instances.
 */
export class RedisRateLimitStore implements Store {
    private windowMs!: number;
    private readonly keyPrefix: string;

    constructor(
        private readonly client: IORedis,
        keyPrefix = 'rl:',
    ) {
        this.keyPrefix = keyPrefix;
    }

    init(options: Options): void {
        this.windowMs = options.windowMs;
    }

    async increment(rawKey: string): Promise<ClientRateLimitInfo> {
        try {
            const key = `${this.keyPrefix}${rawKey}`;
            const ttlSec = Math.ceil(this.windowMs / 1000);

            const pipeline = this.client.pipeline();
            pipeline.incr(key);
            pipeline.pttl(key);
            const results = await pipeline.exec();

            const totalHits = (results?.[0]?.[1] as number) ?? 1;
            let ttlMs = (results?.[1]?.[1] as number) ?? -1;

            if (ttlMs < 0) {
                await this.client.expire(key, ttlSec);
                ttlMs = this.windowMs;
            }

            return { totalHits, resetTime: new Date(Date.now() + ttlMs) };
        } catch {
            // Redis unavailable — allow the request through rather than blocking everyone
            return { totalHits: 0, resetTime: new Date(Date.now() + this.windowMs) };
        }
    }

    async decrement(rawKey: string): Promise<void> {
        try {
            const key = `${this.keyPrefix}${rawKey}`;
            const val = await this.client.get(key);
            if (val && parseInt(val) > 0) await this.client.decr(key);
        } catch { /* silent */ }
    }

    async resetKey(rawKey: string): Promise<void> {
        try {
            await this.client.del(`${this.keyPrefix}${rawKey}`);
        } catch { /* silent */ }
    }
}
