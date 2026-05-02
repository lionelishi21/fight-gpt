import winston from 'winston';
/**
 * Logger helper
 * Follows Single Responsibility Principle - handles all logging
 */
export declare class Logger {
    private static instance;
    /**
     * Get logger instance (Singleton pattern)
     */
    static getInstance(): winston.Logger;
    /**
     * Log info message
     */
    static info(message: string, meta?: unknown): void;
    /**
     * Log error message
     */
    static error(message: string, error?: Error | unknown): void;
    /**
     * Log warning message
     */
    static warn(message: string, meta?: unknown): void;
    /**
     * Log debug message
     */
    static debug(message: string, meta?: unknown): void;
}
//# sourceMappingURL=logger.d.ts.map