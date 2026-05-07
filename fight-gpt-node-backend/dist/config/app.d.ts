/**
 * Application configuration
 * Follows Single Responsibility Principle - handles application configuration
 */
export declare class AppConfig {
    static get PORT(): number;
    static get NODE_ENV(): string;
    static get AI_SERVICE_URL(): string;
    static get AI_SERVICE_TIMEOUT(): number;
    static get MONGODB_URI(): string;
    static get RATE_LIMIT_WINDOW_MS(): number;
    static get RATE_LIMIT_MAX_REQUESTS(): number;
    static get CORS_ORIGINS(): string[] | boolean;
    static get LOG_LEVEL(): string;
    static get GEMINI_API_KEY(): string;
    static get GEMINI_MODEL(): string;
    static get STRIPE_SECRET_KEY(): string;
    static get STRIPE_WEBHOOK_SECRET(): string;
    static get APP_URL(): string;
    static get GOOGLE_CLOUD_PROJECT(): string;
    static get GOOGLE_CLOUD_LOCATION(): string;
    static get GOOGLE_STORAGE_BUCKET(): string;
    /**
     * Validate required configuration
     */
    static validate(): void;
    /**
     * Check if running in production
     */
    static isProduction(): boolean;
    /**
     * Check if running in development
     */
    static isDevelopment(): boolean;
}
//# sourceMappingURL=app.d.ts.map