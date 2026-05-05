"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
/**
 * Application configuration
 * Follows Single Responsibility Principle - handles application configuration
 */
class AppConfig {
    static get PORT() { return parseInt(process.env.PORT || '3010', 10); }
    static get NODE_ENV() { return process.env.NODE_ENV || 'development'; }
    static get AI_SERVICE_URL() { return process.env.AI_SERVICE_URL || 'http://localhost:8000'; }
    static get AI_SERVICE_TIMEOUT() { return parseInt(process.env.AI_SERVICE_TIMEOUT || '600000', 10); }
    static get MONGODB_URI() { return process.env.MONGODB_URI || process.env.MONGO_URI || ''; }
    static get RATE_LIMIT_WINDOW_MS() { return parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); }
    static get RATE_LIMIT_MAX_REQUESTS() { return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); }
    static get CORS_ORIGINS() {
        if (process.env.CORS_ORIGIN === '*')
            return true;
        if (process.env.CORS_ORIGIN)
            return process.env.CORS_ORIGIN.split(',').map(o => o.trim());
        return ['http://localhost:5174', 'http://localhost:3000', 'https://metapunish.com', 'https://www.metapunish.com'];
    }
    static get LOG_LEVEL() { return process.env.LOG_LEVEL || 'info'; }
    static get GEMINI_API_KEY() { return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''; }
    static get GEMINI_MODEL() { return process.env.GEMINI_MODEL || 'gemini-2.5-flash'; }
    static get STRIPE_SECRET_KEY() { return process.env.STRIPE_SECRET_KEY || ''; }
    static get STRIPE_WEBHOOK_SECRET() { return process.env.STRIPE_WEBHOOK_SECRET || ''; }
    static get APP_URL() { return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; }
    /**
     * Validate required configuration
     */
    static validate() {
        const required = [];
        const missing = [];
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
    static isProduction() {
        return AppConfig.NODE_ENV === 'production';
    }
    /**
     * Check if running in development
     */
    static isDevelopment() {
        return AppConfig.NODE_ENV === 'development';
    }
}
exports.AppConfig = AppConfig;
//# sourceMappingURL=app.js.map