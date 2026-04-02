/**
 * Application configuration
 * Follows Single Responsibility Principle - handles application configuration
 */
export class AppConfig {
  public static get PORT(): number { return parseInt(process.env.PORT || '3010', 10); }
  public static get NODE_ENV(): string { return process.env.NODE_ENV || 'development'; }
  public static get AI_SERVICE_URL(): string { return process.env.AI_SERVICE_URL || 'http://localhost:8000'; }
  public static get AI_SERVICE_TIMEOUT(): number { return parseInt(process.env.AI_SERVICE_TIMEOUT || '600000', 10); }
  public static get MONGODB_URI(): string { return process.env.MONGODB_URI || ''; }
  public static get RATE_LIMIT_WINDOW_MS(): number { return parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); }
  public static get RATE_LIMIT_MAX_REQUESTS(): number { return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); }
  public static get CORS_ORIGIN(): string { return process.env.CORS_ORIGIN || 'http://localhost:5174'; }
  public static get LOG_LEVEL(): string { return process.env.LOG_LEVEL || 'info'; }
  public static get GEMINI_API_KEY(): string { return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''; }
  public static get GEMINI_MODEL(): string { return process.env.GEMINI_MODEL || 'gemini-1.5-flash'; }

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

