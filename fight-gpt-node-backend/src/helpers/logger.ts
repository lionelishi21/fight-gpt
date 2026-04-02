import winston from 'winston';

/**
 * Logger helper
 * Follows Single Responsibility Principle - handles all logging
 */
export class Logger {
  private static instance: winston.Logger;

  /**
   * Get logger instance (Singleton pattern)
   */
  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'fight-gpt-api-gateway' },
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      });
    }

    return Logger.instance;
  }

  /**
   * Log info message
   */
  public static info(message: string, meta?: unknown): void {
    Logger.getInstance().info(message, meta);
  }

  /**
   * Log error message
   */
  public static error(message: string, error?: Error | unknown): void {
    Logger.getInstance().error(message, { error });
  }

  /**
   * Log warning message
   */
  public static warn(message: string, meta?: unknown): void {
    Logger.getInstance().warn(message, meta);
  }

  /**
   * Log debug message
   */
  public static debug(message: string, meta?: unknown): void {
    Logger.getInstance().debug(message, meta);
  }
}

