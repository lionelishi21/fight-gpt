"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../helpers/logger");
/**
 * Database configuration
 * Follows Single Responsibility Principle - handles database connection
 */
class Database {
    static connected = false;
    /**
     * Connect to MongoDB
     */
    static async connect() {
        if (Database.connected) {
            logger_1.Logger.info('Database already connected');
            return;
        }
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            // In development, allow skipping MongoDB for chat-only testing
            if (process.env.NODE_ENV === 'development') {
                logger_1.Logger.warn('MONGODB_URI not set - running in chat-only mode (MongoDB features disabled)');
                return;
            }
            throw new Error('MONGODB_URI environment variable is not set');
        }
        try {
            // MongoDB connection options
            const options = {
                retryWrites: true,
                w: 'majority',
            };
            await mongoose_1.default.connect(mongoUri, options);
            Database.connected = true;
            logger_1.Logger.info(`MongoDB connected successfully to database: ${mongoose_1.default.connection.db?.databaseName || 'fight_gpt'}`);
        }
        catch (error) {
            Database.connected = false;
            logger_1.Logger.error('MongoDB connection failed', error);
            // In development, allow continuing without MongoDB for chat-only testing
            if (process.env.NODE_ENV === 'development') {
                logger_1.Logger.warn('Continuing in chat-only mode (MongoDB features disabled)');
                return;
            }
            throw error;
        }
        // Handle connection events
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.Logger.error('MongoDB connection error', error);
            Database.connected = false;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.Logger.warn('MongoDB disconnected');
            Database.connected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.Logger.info('MongoDB reconnected');
            Database.connected = true;
        });
    }
    /**
     * Disconnect from MongoDB
     */
    static async disconnect() {
        if (!Database.connected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            Database.connected = false;
            logger_1.Logger.info('MongoDB disconnected successfully');
        }
        catch (error) {
            logger_1.Logger.error('MongoDB disconnection failed', error);
            throw error;
        }
    }
    /**
     * Check if database is connected
     */
    static isConnected() {
        return Database.connected && mongoose_1.default.connection.readyState === 1;
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map