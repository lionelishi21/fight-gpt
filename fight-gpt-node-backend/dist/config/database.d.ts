/**
 * Database configuration
 * Follows Single Responsibility Principle - handles database connection
 */
export declare class Database {
    private static connected;
    /**
     * Connect to MongoDB
     */
    static connect(): Promise<void>;
    /**
     * Disconnect from MongoDB
     */
    static disconnect(): Promise<void>;
    /**
     * Check if database is connected
     */
    static isConnected(): boolean;
}
//# sourceMappingURL=database.d.ts.map