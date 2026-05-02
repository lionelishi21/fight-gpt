"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
/**
 * Logger helper
 * Follows Single Responsibility Principle - handles all logging
 */
class Logger {
    static instance;
    /**
     * Get logger instance (Singleton pattern)
     */
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = winston_1.default.createLogger({
                level: process.env.LOG_LEVEL || 'info',
                format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
                defaultMeta: { service: 'fight-gpt-api-gateway' },
                transports: [
                    new winston_1.default.transports.Console({
                        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
                    }),
                    new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
                    new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
                ],
            });
        }
        return Logger.instance;
    }
    /**
     * Log info message
     */
    static info(message, meta) {
        Logger.getInstance().info(message, meta);
    }
    /**
     * Log error message
     */
    static error(message, error) {
        Logger.getInstance().error(message, { error });
    }
    /**
     * Log warning message
     */
    static warn(message, meta) {
        Logger.getInstance().warn(message, meta);
    }
    /**
     * Log debug message
     */
    static debug(message, meta) {
        Logger.getInstance().debug(message, meta);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map