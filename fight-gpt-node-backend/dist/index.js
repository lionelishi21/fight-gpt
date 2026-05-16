"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before other imports
dotenv_1.default.config();
// Sentry must init before any other imports so it can instrument them
const sentry_1 = require("./helpers/sentry");
(0, sentry_1.initSentry)();
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ioredis_1 = __importDefault(require("ioredis"));
const redisRateLimitStore_1 = require("./middleware/redisRateLimitStore");
// Import configuration
const app_1 = require("./config/app");
const database_1 = require("./config/database");
const EngagementService_1 = require("./services/EngagementService");
const EngagementController_1 = require("./controllers/EngagementController");
const engagementRoutes_1 = require("./routes/engagementRoutes");
const logger_1 = require("./helpers/logger");
const SystemInitializer_1 = require("./helpers/SystemInitializer");
// Import routes
const routes_1 = require("./routes");
// Import controllers
const AnalysisController_1 = require("./controllers/AnalysisController");
const HealthController_1 = require("./controllers/HealthController");
const CharacterController_1 = require("./controllers/CharacterController");
const GameController_1 = require("./controllers/GameController");
const GameMetadataController_1 = require("./controllers/GameMetadataController");
const CharacterEncyclopediaController_1 = require("./controllers/CharacterEncyclopediaController");
const ChatController_1 = require("./controllers/ChatController");
const MetaController_1 = require("./controllers/MetaController");
const TheoryController_1 = require("./controllers/TheoryController");
const NotificationController_1 = require("./controllers/NotificationController");
const RivalController_1 = require("./controllers/RivalController");
const UserController_1 = require("./controllers/UserController");
const AdminController_1 = require("./controllers/AdminController");
const PaymentController_1 = require("./controllers/PaymentController");
// Import services
const AnalysisService_1 = require("./services/AnalysisService");
const AiService_1 = require("./services/AiService");
const CharacterService_1 = require("./services/CharacterService");
const GameService_1 = require("./services/GameService");
const GameMetadataService_1 = require("./services/GameMetadataService");
const CharacterEncyclopediaService_1 = require("./services/CharacterEncyclopediaService");
const ChatService_1 = require("./services/ChatService");
const MetaService_1 = require("./services/MetaService");
const IngestionService_1 = require("./services/IngestionService");
const TheoryService_1 = require("./services/TheoryService");
const LobbyService_1 = require("./services/LobbyService");
const NotificationService_1 = require("./services/NotificationService");
const AutoResearchService_1 = require("./services/AutoResearchService");
const RivalService_1 = require("./services/RivalService");
const UserService_1 = require("./services/UserService");
const AdminService_1 = require("./services/AdminService");
const TrendAnalysisService_1 = require("./services/TrendAnalysisService");
const TrainingService_1 = require("./services/TrainingService");
const PaymentService_1 = require("./services/PaymentService");
const RosterSyncService_1 = require("./services/RosterSyncService");
const ScraperService_1 = require("./services/ScraperService");
const EmailService_1 = require("./services/EmailService");
// Import repositories
const AnalysisRepository_1 = require("./repositories/AnalysisRepository");
const AuditLogRepository_1 = require("./repositories/AuditLogRepository");
const CharacterRepository_1 = require("./repositories/CharacterRepository");
const GameRepository_1 = require("./repositories/GameRepository");
const GameMetadataRepository_1 = require("./repositories/GameMetadataRepository");
const CharacterEncyclopediaRepository_1 = require("./repositories/CharacterEncyclopediaRepository");
const VectorRepository_1 = require("./repositories/VectorRepository");
const MetaRepository_1 = require("./repositories/MetaRepository");
const IngestionRepository_1 = require("./repositories/IngestionRepository");
const TheoryRepository_1 = require("./repositories/TheoryRepository");
const NotificationRepository_1 = require("./repositories/NotificationRepository");
const RivalRepository_1 = require("./repositories/RivalRepository");
const GameSearchStrategyRepository_1 = require("./repositories/GameSearchStrategyRepository");
// Import middleware
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const notFoundMiddleware_1 = require("./middleware/notFoundMiddleware");
/**
 * Application class
 * Follows Single Responsibility Principle - handles application initialization and startup
 * Follows Dependency Inversion Principle - depends on abstractions (interfaces)
 */
class App {
    app;
    server;
    io;
    routes;
    ingestionService = null;
    rosterSyncService = null;
    trainingService = null;
    trendAnalysisService = null;
    lobbyService;
    constructor() {
        // Validate configuration
        app_1.AppConfig.validate();
        // Initialize Express app
        this.app = (0, express_1.default)();
        // Setup HTTP server and Socket.io
        const { createServer } = require('http');
        const { Server } = require('socket.io');
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: (origin, cb) => cb(null, true), // CORS handled by raw middleware above
                credentials: true,
            }
        });
        // Initialize Socket.io events
        this.setupSocketEvents();
        // Setup middleware
        this.setupMiddleware();
        // Initialize dependencies (dependency injection)
        // Note: Repositories may not work without MongoDB, but ChatService only needs Gemini API
        const analysisRepository = app_1.AppConfig.MONGODB_URI ? new AnalysisRepository_1.AnalysisRepository() : null;
        const auditLogRepository = app_1.AppConfig.MONGODB_URI ? new AuditLogRepository_1.AuditLogRepository() : null;
        const characterRepository = app_1.AppConfig.MONGODB_URI ? new CharacterRepository_1.CharacterRepository() : null;
        const gameRepository = app_1.AppConfig.MONGODB_URI ? new GameRepository_1.GameRepository() : null;
        const gameMetadataRepository = app_1.AppConfig.MONGODB_URI ? new GameMetadataRepository_1.GameMetadataRepository() : null;
        const characterEncyclopediaRepository = app_1.AppConfig.MONGODB_URI ? new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository() : null;
        const vectorRepository = app_1.AppConfig.MONGODB_URI ? new VectorRepository_1.VectorRepository() : null;
        const metaRepository = app_1.AppConfig.MONGODB_URI ? new MetaRepository_1.MetaRepository() : null;
        const ingestionRepository = app_1.AppConfig.MONGODB_URI ? new IngestionRepository_1.IngestionRepository() : null;
        const theoryRepository = app_1.AppConfig.MONGODB_URI ? new TheoryRepository_1.TheoryRepository() : null;
        const notificationRepository = app_1.AppConfig.MONGODB_URI ? new NotificationRepository_1.NotificationRepository() : null;
        const rivalRepository = app_1.AppConfig.MONGODB_URI ? new RivalRepository_1.RivalRepository() : null;
        // Only initialize services that need MongoDB if MongoDB is available
        const gameMetadataService = app_1.AppConfig.MONGODB_URI ? new GameMetadataService_1.GameMetadataService(gameMetadataRepository) : null;
        const characterEncyclopediaService = app_1.AppConfig.MONGODB_URI ? new CharacterEncyclopediaService_1.CharacterEncyclopediaService(characterEncyclopediaRepository) : null;
        const emailService = new EmailService_1.EmailService();
        const notificationService = app_1.AppConfig.MONGODB_URI ? new NotificationService_1.NotificationService(notificationRepository, emailService) : null;
        const aiService = app_1.AppConfig.MONGODB_URI ? new AiService_1.AiService(app_1.AppConfig.GEMINI_API_KEY, app_1.AppConfig.GEMINI_MODEL, gameMetadataService, characterEncyclopediaService) : null;
        const characterService = app_1.AppConfig.MONGODB_URI ? new CharacterService_1.CharacterService(characterRepository, gameRepository) : null;
        const analysisService = app_1.AppConfig.MONGODB_URI ? new AnalysisService_1.AnalysisService(analysisRepository, aiService, gameMetadataService, characterEncyclopediaService, characterService, // Pass characterService for character name lookup
        vectorRepository, notificationService, rivalRepository) : null;
        const gameService = app_1.AppConfig.MONGODB_URI ? new GameService_1.GameService(gameRepository, characterRepository) : null;
        const metaService = app_1.AppConfig.MONGODB_URI ? new MetaService_1.MetaService(metaRepository, vectorRepository, app_1.AppConfig.GEMINI_API_KEY, characterRepository) : null;
        const searchStrategyRepository = app_1.AppConfig.MONGODB_URI ? new GameSearchStrategyRepository_1.GameSearchStrategyRepository() : null;
        this.ingestionService = app_1.AppConfig.MONGODB_URI ? new IngestionService_1.IngestionService(ingestionRepository, analysisService, metaService, searchStrategyRepository, notificationService) : null;
        const theoryService = app_1.AppConfig.MONGODB_URI ? new TheoryService_1.TheoryService(theoryRepository, vectorRepository, app_1.AppConfig.GEMINI_API_KEY, notificationService) : null;
        const rivalService = app_1.AppConfig.MONGODB_URI ? new RivalService_1.RivalService(rivalRepository) : null;
        const userService = app_1.AppConfig.MONGODB_URI ? new UserService_1.UserService() : null;
        const adminService = app_1.AppConfig.MONGODB_URI ? new AdminService_1.AdminService() : null;
        const scraperService = app_1.AppConfig.MONGODB_URI ? new ScraperService_1.ScraperService(characterEncyclopediaService) : null;
        this.rosterSyncService = app_1.AppConfig.MONGODB_URI ? new RosterSyncService_1.RosterSyncService(scraperService) : null;
        this.lobbyService = new LobbyService_1.LobbyService();
        const autoResearchService = app_1.AppConfig.MONGODB_URI
            ? new AutoResearchService_1.AutoResearchService(theoryService, notificationService)
            : null;
        autoResearchService?.start();
        this.trainingService = app_1.AppConfig.MONGODB_URI ? new TrainingService_1.TrainingService() : null;
        this.trendAnalysisService = app_1.AppConfig.MONGODB_URI
            ? new TrendAnalysisService_1.TrendAnalysisService(analysisRepository, notificationService, gameMetadataService)
            : null;
        const chatService = new ChatService_1.ChatService();
        // Initialize controllers (ChatController works without MongoDB)
        const analysisController = app_1.AppConfig.MONGODB_URI ? new AnalysisController_1.AnalysisController(analysisService, auditLogRepository) : null;
        const healthController = app_1.AppConfig.MONGODB_URI ? new HealthController_1.HealthController(aiService) : null;
        const characterController = app_1.AppConfig.MONGODB_URI ? new CharacterController_1.CharacterController(characterService, auditLogRepository) : null;
        const gameController = app_1.AppConfig.MONGODB_URI ? new GameController_1.GameController(gameService, auditLogRepository) : null;
        const gameMetadataController = app_1.AppConfig.MONGODB_URI ? new GameMetadataController_1.GameMetadataController(gameMetadataService, auditLogRepository) : null;
        const characterEncyclopediaController = app_1.AppConfig.MONGODB_URI ? new CharacterEncyclopediaController_1.CharacterEncyclopediaController(characterEncyclopediaService, auditLogRepository) : null;
        const chatController = new ChatController_1.ChatController(chatService, auditLogRepository || null, rivalRepository || undefined, gameRepository || undefined, analysisRepository || undefined);
        const metaController = app_1.AppConfig.MONGODB_URI ? new MetaController_1.MetaController(metaService, this.ingestionService) : null;
        const theoryController = app_1.AppConfig.MONGODB_URI ? new TheoryController_1.TheoryController(theoryService) : null;
        const notificationController = app_1.AppConfig.MONGODB_URI ? new NotificationController_1.NotificationController(notificationRepository) : null;
        const rivalController = app_1.AppConfig.MONGODB_URI ? new RivalController_1.RivalController(rivalService, auditLogRepository) : null;
        const userController = app_1.AppConfig.MONGODB_URI ? new UserController_1.UserController(userService, auditLogRepository) : null;
        const adminController = app_1.AppConfig.MONGODB_URI ? new AdminController_1.AdminController(adminService, this.ingestionService ?? undefined, metaService ?? undefined, autoResearchService ?? undefined, this.trendAnalysisService ?? undefined, this.rosterSyncService ?? undefined) : null;
        let paymentService;
        let paymentController;
        try {
            paymentService = new PaymentService_1.PaymentService();
            paymentController = new PaymentController_1.PaymentController(paymentService);
        }
        catch (e) {
            logger_1.Logger.warn('PaymentService failed to initialize (Stripe key may be missing). Payment routes disabled.');
            paymentService = null;
            paymentController = new PaymentController_1.PaymentController(null);
        }
        // Setup routes
        const engagementService = new EngagementService_1.EngagementService(theoryService);
        const engagementController = new EngagementController_1.EngagementController(engagementService);
        const engagementRoutes = new engagementRoutes_1.EngagementRoutes(engagementController);
        this.routes = new routes_1.Routes(analysisController, healthController, characterController, gameController, gameMetadataController, characterEncyclopediaController, chatController, metaController, theoryController, notificationController, rivalController, userController, adminController, paymentController, engagementController);
        // Inject Socket.io into chat controller
        chatController.setIo(this.io);
        this.setupRoutes();
        // Setup error handling
        this.setupErrorHandling();
    }
    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Trust nginx/load balancer proxy (fixes X-Forwarded-For rate limiter error)
        this.app.set('trust proxy', 1);
        // Security middleware
        this.app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: "cross-origin" },
            contentSecurityPolicy: false,
        }));
        // CORS — raw header middleware, runs before everything else.
        // Does NOT rely on the cors package so nothing can interfere with it.
        const OWNED_DOMAINS = ['fightingames.online', 'metapunish.com', 'fightgpt.app'];
        const isAllowedOrigin = (origin) => {
            if (!origin)
                return true;
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
                return true;
            return OWNED_DOMAINS.some(d => origin === `https://${d}` || origin === `http://${d}` || origin.endsWith(`.${d}`));
        };
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            // Always set Vary so CDNs/proxies never serve a cached CORS response
            // to a different origin than the one that produced it.
            res.setHeader('Vary', 'Origin');
            res.setHeader('X-API-Version', '7801f9a'); // lets us confirm deployed version
            if (isAllowedOrigin(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin ?? '');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-auth-token,x-admin-key,x-internal-secret');
                res.setHeader('Access-Control-Max-Age', '0'); // disable preflight caching while debugging
            }
            // Answer preflight immediately
            if (req.method === 'OPTIONS') {
                res.sendStatus(204);
                return;
            }
            next();
        });
        // Compression middleware
        this.app.use((0, compression_1.default)());
        // Body parsing middleware
        // Note: We capture the raw body for Stripe webhook verification
        this.app.use(express_1.default.json({
            verify: (req, _res, buf) => {
                if (req.originalUrl.startsWith('/api/payments/webhook')) {
                    req.rawBody = buf;
                }
            }
        }));
        this.app.use(express_1.default.urlencoded({
            extended: true,
            verify: (req, _res, buf) => {
                if (req.originalUrl.startsWith('/api/payments/webhook')) {
                    req.rawBody = buf;
                }
            }
        }));
        // Logging middleware
        if (app_1.AppConfig.isDevelopment()) {
            this.app.use((0, morgan_1.default)('dev'));
        }
        else {
            this.app.use((0, morgan_1.default)('combined'));
        }
        // In development: skip all rate limiting so local testing is never blocked.
        const isDev = app_1.AppConfig.isDevelopment();
        // Redis client for rate limit store.
        // MUST have an error handler — without it, connection failures emit an
        // unhandled 'error' event that crashes the Node.js process entirely.
        const redisClient = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 0,
            enableOfflineQueue: false,
            lazyConnect: true,
        });
        redisClient.on('error', (err) => {
            logger_1.Logger.warn(`[RateLimit] Redis unavailable — rate limiting falling back to memory store: ${err.message}`);
        });
        const makeStore = (prefix) => new redisRateLimitStore_1.RedisRateLimitStore(redisClient, prefix);
        // Global limiter — all user-facing routes.
        // Admin routes excluded (protected by x-admin-key instead).
        // /auth/me excluded — it's a read-only heartbeat called on every page load.
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: app_1.AppConfig.RATE_LIMIT_WINDOW_MS, // default: 15 min
            max: app_1.AppConfig.RATE_LIMIT_MAX_REQUESTS, // default: 1000
            store: makeStore('rl:global:'),
            message: { success: false, error: 'Too many requests. Please slow down.' },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => isDev ||
                req.path.startsWith('/admin/') ||
                req.path === '/auth/me',
        });
        // Auth brute-force limiter — login and register only.
        // 50 attempts per 15 min per IP — strict enough to stop bots,
        // loose enough that a real user testing multiple accounts never gets locked out.
        const authLimiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 50,
            store: makeStore('rl:auth:'),
            message: {
                success: false,
                error: 'Too many login attempts from this IP. Please wait 15 minutes.',
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: () => isDev,
        });
        this.app.use('/api/', limiter);
        this.app.use('/api/auth/login', authLimiter);
        this.app.use('/api/auth/register', authLimiter);
    }
    /**
     * Setup routes
     */
    setupRoutes() {
        // API routes
        this.app.use('/api', this.routes.getRouter());
        // Root route
        this.app.get('/', (_req, res) => {
            res.json({
                success: true,
                message: 'Fight GPT API Gateway is running!',
                version: '2.0.0',
            });
        });
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use(notFoundMiddleware_1.notFoundMiddleware);
        // Sentry error handler (must come before custom error handler)
        const { Sentry } = require('./helpers/sentry');
        if (process.env.SENTRY_DSN) {
            this.app.use(Sentry.expressErrorHandler());
        }
        // Error handler (must be last)
        this.app.use(errorMiddleware_1.errorMiddleware);
    }
    /**
     * Setup Socket.io events
     */
    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            logger_1.Logger.info(`SOCKET_LINK: Client connected [${socket.id}]`);
            // Handle user join room (specific to userId for cross-device sync)
            socket.on('join_user_room', (userId) => {
                if (userId) {
                    socket.join(`user_${userId}`);
                    logger_1.Logger.info(`SOCKET_LINK: User ${userId} joined their neural room`);
                }
            });
            socket.on('disconnect', () => {
                logger_1.Logger.info(`SOCKET_LINK: Client disconnected [${socket.id}]`);
            });
        });
        // Lobby Namespace for real-time Dojo interaction
        const lobbyNamespace = this.io.of('/lobby');
        lobbyNamespace.on('connection', (socket) => {
            logger_1.Logger.info(`DOJO_LOBBY: Operator connected [${socket.id}]`);
            socket.on('join_lobby', async (data) => {
                const { lobbyId, userId } = data;
                if (!lobbyId || !userId)
                    return;
                socket.join(`lobby_${lobbyId}`);
                socket.lobbyId = lobbyId; // Store for disconnect
                await this.lobbyService.updateActiveCount(lobbyId, 1);
                // Broadcast user joined
                lobbyNamespace.to(`lobby_${lobbyId}`).emit('operator_joined', { userId });
                logger_1.Logger.info(`DOJO_LOBBY: User ${userId} joined room lobby_${lobbyId}`);
            });
            socket.on('send_message', async (data) => {
                logger_1.Logger.info(`DOJO_LOBBY: Message from ${data.userId} to ${data.lobbyId}: ${data.content.substring(0, 20)}...`);
                const message = await this.lobbyService.saveMessage(data);
                if (message) {
                    lobbyNamespace.to(`lobby_${data.lobbyId}`).emit('new_message', message);
                    logger_1.Logger.info(`DOJO_LOBBY: Broadcasted new_message to lobby_${data.lobbyId}`);
                }
            });
            socket.on('leave_lobby', async (data) => {
                const { lobbyId, userId } = data;
                socket.leave(`lobby_${lobbyId}`);
                await this.lobbyService.updateActiveCount(lobbyId, -1);
                lobbyNamespace.to(`lobby_${lobbyId}`).emit('operator_left', { userId });
            });
            socket.on('disconnect', async () => {
                if (socket.lobbyId) {
                    await this.lobbyService.updateActiveCount(socket.lobbyId, -1);
                }
                logger_1.Logger.info(`DOJO_LOBBY: Operator disconnected [${socket.id}]`);
            });
        });
    }
    /**
     * Start the application
     */
    async start() {
        try {
            // Connect to database
            await database_1.Database.connect();
            // Run system initialization (auto-seeding & admin setup)
            const startMetaRoutes = this.routes.getMetaRoutes();
            const startMetaService = startMetaRoutes?.getController()?.getMetaService();
            SystemInitializer_1.SystemInitializer.run(startMetaService ?? undefined, this.rosterSyncService ?? undefined).catch(err => {
                logger_1.Logger.error('SYSTEM_INITIALIZATION: Failed during startup', err);
            });
            // Start ingestion scheduler (every 6 hours)
            if (this.ingestionService) {
                this.ingestionService.startScheduler();
            }
            // Start meta synthesis scheduler (every 24 hours)
            if (startMetaRoutes) {
                if (startMetaService) {
                    startMetaService.startScheduler();
                }
            }
            // Start trend analysis and training schedulers
            if (this.trendAnalysisService) {
                this.trendAnalysisService.startScheduler();
            }
            if (this.trainingService) {
                this.trainingService.startScheduler();
            }
            // Start server
            this.server.listen(app_1.AppConfig.PORT, () => {
                logger_1.Logger.info(`Server running on port ${app_1.AppConfig.PORT} in ${app_1.AppConfig.NODE_ENV} mode`);
                logger_1.Logger.info(`API Gateway: http://localhost:${app_1.AppConfig.PORT}`);
                logger_1.Logger.info(`Health check: http://localhost:${app_1.AppConfig.PORT}/api/health`);
            });
        }
        catch (error) {
            logger_1.Logger.error('Failed to start application', error);
            process.exit(1);
        }
    }
    /**
     * Stop the application
     */
    async stop() {
        try {
            if (this.ingestionService) {
                this.ingestionService.stopScheduler();
            }
            await database_1.Database.disconnect();
            logger_1.Logger.info('Application stopped');
        }
        catch (error) {
            logger_1.Logger.error('Failed to stop application', error);
        }
    }
    /**
     * Get Express app instance
     */
    getApp() {
        return this.app;
    }
}
exports.App = App;
// Start the application if this file is run directly
if (require.main === module) {
    const app = new App();
    app.start();
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger_1.Logger.info('SIGTERM received, shutting down gracefully...');
        await app.stop();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        logger_1.Logger.info('SIGINT received, shutting down gracefully...');
        await app.stop();
        process.exit(0);
    });
}
// Export app for testing
exports.default = App;
//# sourceMappingURL=index.js.map