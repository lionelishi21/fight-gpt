import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry — only activates when SENTRY_DSN is set.
 * Set SENTRY_DSN in your production .env to enable error tracking.
 * Get a DSN at https://sentry.io (free tier is sufficient for launch).
 */
export function initSentry(): void {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return; // silent no-op in dev / if not configured

    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.2, // 20% of requests traced — adjust after launch
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
        ],
    });
}

export { Sentry };
