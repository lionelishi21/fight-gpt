/**
 * Application configuration
 * Follows Single Responsibility Principle - handles application configuration
 */
export class AppConfig {
  public static get PORT(): number { return parseInt(process.env.PORT || '3010', 10); }
  public static get NODE_ENV(): string { return process.env.NODE_ENV || 'development'; }
  public static get AI_SERVICE_URL(): string { return process.env.AI_SERVICE_URL || 'http://localhost:8000'; }
  public static get AI_SERVICE_TIMEOUT(): number { return parseInt(process.env.AI_SERVICE_TIMEOUT || '600000', 10); }
  public static get MONGODB_URI(): string { return process.env.MONGODB_URI || process.env.MONGO_URI || ''; }
  public static get RATE_LIMIT_WINDOW_MS(): number { return parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); }
  public static get RATE_LIMIT_MAX_REQUESTS(): number { return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10); }
  /**
   * CORS origin handler. Priority:
   * 1. CORS_ORIGIN=* → allow everything (useful for staging)
   * 2. CORS_ORIGIN=url,url → exact list from env
   * 3. Fallback → function that allows any localhost port (dev) +
   *    any subdomain of our owned domains (prod) without needing env updates.
   */
  public static get CORS_ORIGINS(): any {
    const env = process.env.CORS_ORIGIN;
    if (env === '*') return true;
    if (env) return env.split(',').map(o => o.trim());

    const OWNED_DOMAINS = [
      'fightingames.online',
      'metapunish.com',
      'fightgpt.app',
    ];

    return (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      // Server-to-server or same-origin requests (no Origin header) — allow
      if (!origin) return cb(null, true);

      // Any localhost / loopback — allow in all environments
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }

      // Any subdomain (or apex) of our owned domains — allow
      const allowed = OWNED_DOMAINS.some(domain =>
        origin === `https://${domain}` ||
        origin === `http://${domain}` ||
        origin.endsWith(`.${domain}`)
      );

      if (allowed) return cb(null, true);

      cb(new Error(`CORS: origin not allowed — ${origin}`));
    };
  }
  public static get LOG_LEVEL(): string { return process.env.LOG_LEVEL || 'info'; }
  public static get GEMINI_API_KEY(): string { return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''; }
  public static get GEMINI_MODEL(): string { return process.env.GEMINI_MODEL || 'gemini-1.5-flash'; }
  public static get STRIPE_SECRET_KEY(): string { return process.env.STRIPE_SECRET_KEY || ''; }
  public static get STRIPE_WEBHOOK_SECRET(): string { return process.env.STRIPE_WEBHOOK_SECRET || ''; }
  public static get RESEND_API_KEY(): string { return process.env.RESEND_API_KEY || ''; }
  public static get APP_URL(): string { return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; }
  public static get GOOGLE_CLOUD_PROJECT(): string { return process.env.GOOGLE_CLOUD_PROJECT || ''; }
  public static get GOOGLE_CLOUD_LOCATION(): string { return process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'; }
  public static get GOOGLE_STORAGE_BUCKET(): string { return process.env.GOOGLE_STORAGE_BUCKET || ''; }

  /**
   * Validate required configuration
   */
  public static validate(): void {
    const required = [];
    const missing: string[] = [];

    // MongoDB is required for most features, but optional for chat-only testing
    if (!AppConfig.MONGODB_URI && AppConfig.isProduction()) {
      required.push('MONGODB_URI');
    }

    // GEMINI_API_KEY is required for chat service
    if (!AppConfig.GEMINI_API_KEY && AppConfig.isProduction()) {
      required.push('GEMINI_API_KEY');
    }

    for (const key of required) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Warn in development if optional but recommended vars are missing
    if (AppConfig.isDevelopment() && !AppConfig.MONGODB_URI) {
      console.warn('[WARN] MONGODB_URI is not set. Some features may not work. Chat service will work with GEMINI_API_KEY only.');
    }

    if (AppConfig.isDevelopment() && !AppConfig.GEMINI_API_KEY) {
      console.warn('[WARN] GEMINI_API_KEY is not set. Chat service will not work.');
    }
  }

  /**
   * Check if running in production
   */
  public static isProduction(): boolean {
    return AppConfig.NODE_ENV === 'production';
  }

  /**
   * Check if running in development
   */
  public static isDevelopment(): boolean {
    return AppConfig.NODE_ENV === 'development';
  }
}

