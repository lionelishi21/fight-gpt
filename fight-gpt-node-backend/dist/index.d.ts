import { Express } from 'express';
/**
 * Application class
 * Follows Single Responsibility Principle - handles application initialization and startup
 * Follows Dependency Inversion Principle - depends on abstractions (interfaces)
 */
export declare class App {
    private app;
    private server;
    private io;
    private routes;
    private ingestionService;
    private rosterSyncService;
    private lobbyService;
    constructor();
    /**
     * Setup middleware
     */
    private setupMiddleware;
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Setup error handling
     */
    private setupErrorHandling;
    /**
     * Setup Socket.io events
     */
    private setupSocketEvents;
    /**
     * Start the application
     */
    start(): Promise<void>;
    /**
     * Stop the application
     */
    stop(): Promise<void>;
    /**
     * Get Express app instance
     */
    getApp(): Express;
}
export default App;
//# sourceMappingURL=index.d.ts.map