import mongoose from 'mongoose';
import { Logger } from '../helpers/logger';

/**
 * Database configuration
 * Follows Single Responsibility Principle - handles database connection
 */
export class Database {
  private static connected: boolean = false;

  /**
   * Connect to MongoDB
   */
  public static async connect(): Promise<void> {
    if (Database.connected) {
      Logger.info('Database already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      // In development, allow skipping MongoDB for chat-only testing
      if (process.env.NODE_ENV === 'development') {
        Logger.warn('MONGODB_URI not set - running in chat-only mode (MongoDB features disabled)');
        return;
      }
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      // MongoDB connection options
      const options = {
        retryWrites: true,
        w: 'majority' as const,
      };

      await mongoose.connect(mongoUri, options);
      Database.connected = true;
      Logger.info(`MongoDB connected successfully to database: ${mongoose.connection.db?.databaseName || 'fight_gpt'}`);
    } catch (error) {
      Database.connected = false;
      Logger.error('MongoDB connection failed', error);

      // In development, allow continuing without MongoDB for chat-only testing
      if (process.env.NODE_ENV === 'development') {
        Logger.warn('Continuing in chat-only mode (MongoDB features disabled)');
        return;
      }

      throw error;
    }

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      Logger.error('MongoDB connection error', error);
      Database.connected = false;
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected');
      Database.connected = false;
    });

    mongoose.connection.on('reconnected', () => {
      Logger.info('MongoDB reconnected');
      Database.connected = true;
    });
  }

  /**
   * Disconnect from MongoDB
   */
  public static async disconnect(): Promise<void> {
    if (!Database.connected) {
      return;
    }

    try {
      await mongoose.disconnect();
      Database.connected = false;
      Logger.info('MongoDB disconnected successfully');
    } catch (error) {
      Logger.error('MongoDB disconnection failed', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  public static isConnected(): boolean {
    return Database.connected && mongoose.connection.readyState === 1;
  }
}

