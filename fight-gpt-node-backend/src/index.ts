import dotenv from 'dotenv';
// Load environment variables before other imports
dotenv.config();

// Sentry must init before any other imports so it can instrument them
import { initSentry } from './helpers/sentry';
initSentry();

import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit, { Store, IncrementCallback } from 'express-rate-limit';
import IORedis from 'ioredis';

// Import configuration
import { AppConfig } from './config/app';
import { Database } from './config/database';
import { EngagementService } from './services/EngagementService';
import { EngagementController } from './controllers/EngagementController';
import { EngagementRoutes } from './routes/engagementRoutes';
import { Logger } from './helpers/logger';
import { SystemInitializer } from './helpers/SystemInitializer';

// Import routes
import { Routes } from './routes';

// Import controllers
import { AnalysisController } from './controllers/AnalysisController';
import { HealthController } from './controllers/HealthController';
import { CharacterController } from './controllers/CharacterController';
import { GameController } from './controllers/GameController';
import { GameMetadataController } from './controllers/GameMetadataController';
import { CharacterEncyclopediaController } from './controllers/CharacterEncyclopediaController';
import { ChatController } from './controllers/ChatController';
import { MetaController } from './controllers/MetaController';
import { TheoryController } from './controllers/TheoryController';
import { NotificationController } from './controllers/NotificationController';
import { RivalController } from './controllers/RivalController';
import { UserController } from './controllers/UserController';
import { AdminController } from './controllers/AdminController';
import { PaymentController } from './controllers/PaymentController';

// Import services
import { AnalysisService } from './services/AnalysisService';
import { AiService } from './services/AiService';
import { CharacterService } from './services/CharacterService';
import { GameService } from './services/GameService';
import { GameMetadataService } from './services/GameMetadataService';
import { CharacterEncyclopediaService } from './services/CharacterEncyclopediaService';
import { ChatService } from './services/ChatService';
import { MetaService } from './services/MetaService';
import { IngestionService } from './services/IngestionService';
import { TheoryService } from './services/TheoryService';
import { LobbyService } from './services/LobbyService';
import { NotificationService } from './services/NotificationService';
import { AutoResearchService } from './services/AutoResearchService';
import { RivalService } from './services/RivalService';
import { UserService } from './services/UserService';
import { AdminService } from './services/AdminService';
import { TrendAnalysisService, ITrendAnalysisService } from './services/TrendAnalysisService';
import { TrainingService } from './services/TrainingService';
import { PaymentService } from './services/PaymentService';
import { RosterSyncService } from './services/RosterSyncService';
import { ScraperService } from './services/ScraperService';
import { EmailService } from './services/EmailService';

// Import repositories
import { AnalysisRepository } from './repositories/AnalysisRepository';
import { AuditLogRepository } from './repositories/AuditLogRepository';
import { CharacterRepository } from './repositories/CharacterRepository';
import { GameRepository } from './repositories/GameRepository';
import { GameMetadataRepository } from './repositories/GameMetadataRepository';
import { CharacterEncyclopediaRepository } from './repositories/CharacterEncyclopediaRepository';
import { VectorRepository } from './repositories/VectorRepository';
import { MetaRepository } from './repositories/MetaRepository';
import { IngestionRepository } from './repositories/IngestionRepository';
import { TheoryRepository } from './repositories/TheoryRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { RivalRepository } from './repositories/RivalRepository';
import { GameSearchStrategyRepository } from './repositories/GameSearchStrategyRepository';

// Import middleware
import { errorMiddleware } from './middleware/errorMiddleware';
import { notFoundMiddleware } from './middleware/notFoundMiddleware';

/**
 * Application class
 * Follows Single Responsibility Principle - handles application initialization and startup
 * Follows Dependency Inversion Principle - depends on abstractions (interfaces)
 */
export class App {
  private app: Express;
  private server: any;
  private io: any;
  private routes: Routes;
  private ingestionService: InstanceType<typeof IngestionService> | null = null;
  private rosterSyncService: RosterSyncService | null = null;
  private trainingService: TrainingService | null = null;
  private trendAnalysisService: ITrendAnalysisService | null = null;
  private lobbyService: LobbyService;

  constructor() {
    // Validate configuration
    AppConfig.validate();

    // Initialize Express app
    this.app = express();

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
    const analysisRepository = AppConfig.MONGODB_URI ? new AnalysisRepository() : null as any;
    const auditLogRepository = AppConfig.MONGODB_URI ? new AuditLogRepository() : null as any;
    const characterRepository = AppConfig.MONGODB_URI ? new CharacterRepository() : null as any;
    const gameRepository = AppConfig.MONGODB_URI ? new GameRepository() : null as any;
    const gameMetadataRepository = AppConfig.MONGODB_URI ? new GameMetadataRepository() : null as any;
    const characterEncyclopediaRepository = AppConfig.MONGODB_URI ? new CharacterEncyclopediaRepository() : null as any;
    const vectorRepository = AppConfig.MONGODB_URI ? new VectorRepository() : null as any;
    const metaRepository = AppConfig.MONGODB_URI ? new MetaRepository() : null as any;
    const ingestionRepository = AppConfig.MONGODB_URI ? new IngestionRepository() : null as any;
    const theoryRepository = AppConfig.MONGODB_URI ? new TheoryRepository() : null as any;
    const notificationRepository = AppConfig.MONGODB_URI ? new NotificationRepository() : null as any;
    const rivalRepository = AppConfig.MONGODB_URI ? new RivalRepository() : null as any;
    // Only initialize services that need MongoDB if MongoDB is available
    const gameMetadataService = AppConfig.MONGODB_URI ? new GameMetadataService(gameMetadataRepository) : null as any;
    const characterEncyclopediaService = AppConfig.MONGODB_URI ? new CharacterEncyclopediaService(characterEncyclopediaRepository) : null as any;
    const emailService = new EmailService();
    const notificationService = AppConfig.MONGODB_URI ? new NotificationService(notificationRepository, emailService) : null as any;
    const aiService = AppConfig.MONGODB_URI ? new AiService(
      AppConfig.GEMINI_API_KEY,
      AppConfig.GEMINI_MODEL,
      gameMetadataService,
      characterEncyclopediaService
    ) : null as any;
    const characterService = AppConfig.MONGODB_URI ? new CharacterService(characterRepository, gameRepository) : null as any;
    const analysisService = AppConfig.MONGODB_URI ? new AnalysisService(
      analysisRepository,
      aiService,
      gameMetadataService,
      characterEncyclopediaService,
      characterService, // Pass characterService for character name lookup
      vectorRepository,
      notificationService,
      rivalRepository
    ) : null as any;
    const gameService = AppConfig.MONGODB_URI ? new GameService(gameRepository, characterRepository) : null as any;
    const metaService = AppConfig.MONGODB_URI ? new MetaService(metaRepository, vectorRepository, AppConfig.GEMINI_API_KEY, characterRepository) : null as any;
    const searchStrategyRepository = AppConfig.MONGODB_URI ? new GameSearchStrategyRepository() : null as any;
    this.ingestionService = AppConfig.MONGODB_URI ? new IngestionService(ingestionRepository, analysisService, metaService, searchStrategyRepository, notificationService) : null;
    const theoryService = AppConfig.MONGODB_URI ? new TheoryService(theoryRepository, vectorRepository, AppConfig.GEMINI_API_KEY, notificationService) : null as any;
    const rivalService = AppConfig.MONGODB_URI ? new RivalService(rivalRepository) : null as any;
    const userService = AppConfig.MONGODB_URI ? new UserService() : null as any;
    const adminService = AppConfig.MONGODB_URI ? new AdminService() : null as any;
    const scraperService = AppConfig.MONGODB_URI ? new ScraperService(characterEncyclopediaService) : null as any;
    this.rosterSyncService = AppConfig.MONGODB_URI ? new RosterSyncService(scraperService) : null as any;
    this.lobbyService = new LobbyService();
    const autoResearchService = AppConfig.MONGODB_URI
        ? new AutoResearchService(theoryService, notificationService)
        : null;
    autoResearchService?.start();
    
    this.trainingService = AppConfig.MONGODB_URI ? new TrainingService() : null;
    
    this.trendAnalysisService = AppConfig.MONGODB_URI
        ? new TrendAnalysisService(analysisRepository, notificationService, gameMetadataService)
        : null;

    const chatService = new ChatService();

    // Initialize controllers (ChatController works without MongoDB)
    const analysisController = AppConfig.MONGODB_URI ? new AnalysisController(analysisService, auditLogRepository) : null as any;
    const healthController = AppConfig.MONGODB_URI ? new HealthController(aiService) : null as any;
    const characterController = AppConfig.MONGODB_URI ? new CharacterController(characterService, auditLogRepository) : null as any;
    const gameController = AppConfig.MONGODB_URI ? new GameController(gameService, auditLogRepository) : null as any;
    const gameMetadataController = AppConfig.MONGODB_URI ? new GameMetadataController(gameMetadataService, auditLogRepository) : null as any;
    const characterEncyclopediaController = AppConfig.MONGODB_URI ? new CharacterEncyclopediaController(
      characterEncyclopediaService,
      auditLogRepository
    ) : null as any;
    const chatController = new ChatController(
      chatService,
      auditLogRepository || null as any,
      rivalRepository || undefined,
      gameRepository || undefined,
      analysisRepository || undefined,
    );
    const metaController = AppConfig.MONGODB_URI ? new MetaController(metaService, this.ingestionService!) : null;
    const theoryController = AppConfig.MONGODB_URI ? new TheoryController(theoryService) : null;
    const notificationController = AppConfig.MONGODB_URI ? new NotificationController(notificationRepository) : null;
    const rivalController = AppConfig.MONGODB_URI ? new RivalController(rivalService, auditLogRepository) : null;
    const userController = AppConfig.MONGODB_URI ? new UserController(userService, auditLogRepository) : null;
    const adminController = AppConfig.MONGODB_URI ? new AdminController(
      adminService, 
      this.ingestionService ?? undefined, 
      metaService ?? undefined, 
      autoResearchService ?? undefined, 
      this.trendAnalysisService ?? undefined,
      this.rosterSyncService ?? undefined
    ) : null;
    let paymentService: PaymentService;
    let paymentController: PaymentController;
    try {
      paymentService = new PaymentService();
      paymentController = new PaymentController(paymentService);
    } catch (e) {
      Logger.warn('PaymentService failed to initialize (Stripe key may be missing). Payment routes disabled.');
      paymentService = null as any;
      paymentController = new PaymentController(null as any);
    }


    // Setup routes
    const engagementService = new EngagementService(theoryService);
    const engagementController = new EngagementController(engagementService);
    const engagementRoutes = new EngagementRoutes(engagementController);

    this.routes = new Routes(
      analysisController,
      healthController,
      characterController,
      gameController,
      gameMetadataController,
      characterEncyclopediaController,
      chatController,
      metaController,
      theoryController,
      notificationController,
      rivalController,
      userController,
      adminController,
      paymentController,
      engagementController
    );
    

    // Inject Socket.io into chat controller
    chatController.setIo(this.io);

    this.setupRoutes();

    // Setup error handling
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Trust nginx/load balancer proxy (fixes X-Forwarded-For rate limiter error)
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }));

    // CORS — raw header middleware, runs before everything else.
    // Does NOT rely on the cors package so nothing can interfere with it.
    const OWNED_DOMAINS = ['fightingames.online', 'metapunish.com', 'fightgpt.app'];
    const isAllowedOrigin = (origin: string | undefined): boolean => {
      if (!origin) return true;
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
      return OWNED_DOMAINS.some(d =>
        origin === `https://${d}` || origin === `http://${d}` || origin.endsWith(`.${d}`)
      );
    };

    this.app.use((req: any, res: any, next: any) => {
      const origin = req.headers.origin as string | undefined;

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
    this.app.use(compression());

    // Body parsing middleware
    // Note: We capture the raw body for Stripe webhook verification
    this.app.use(express.json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl.startsWith('/api/payments/webhook')) {
          req.rawBody = buf;
        }
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true,
      verify: (req: any, _res, buf) => {
        if (req.originalUrl.startsWith('/api/payments/webhook')) {
          req.rawBody = buf;
        }
      }
    }));

    // Logging middleware
    if (AppConfig.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    const isDev = AppConfig.isDevelopment();

    const WINDOW_MS = AppConfig.RATE_LIMIT_WINDOW_MS || 900000;

    // Lazy Redis store — connects in the background after the constructor completes.
    // Each store method falls back gracefully if Redis isn't ready yet or goes down.
    // This shares rate-limit counters across all PM2 instances without ever blocking startup.
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    let redisReady = false;
    const redisClient = new IORedis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 2000, lazyConnect: true });
    redisClient.on('error', (e: Error) => Logger.warn(`[RateLimit] Redis error (in-memory fallback active): ${e.message}`));
    redisClient.connect()
      .then(() => { redisReady = true; Logger.info('[RateLimit] Redis store connected — limits shared across instances'); })
      .catch((e: Error) => Logger.warn(`[RateLimit] Redis unavailable, using per-instance in-memory: ${e.message}`));

    const rateLimitStore: Store = {
      async increment(key: string) {
        if (!redisReady) return { totalHits: 1 };
        try {
          const hits = await redisClient.incr(key);
          if (hits === 1) await redisClient.pexpire(key, WINDOW_MS);
          const ttlMs = await redisClient.pttl(key);
          return { totalHits: hits, resetTime: new Date(Date.now() + Math.max(ttlMs, 0)) };
        } catch { return { totalHits: 1 }; }
      },
      async decrement(key: string) {
        if (redisReady) try { await redisClient.decr(key); } catch {}
      },
      async resetKey(key: string) {
        if (redisReady) try { await redisClient.del(key); } catch {}
      },
    } as Store;

    // Global limiter — uses Redis store when available, in-memory when not.
    const limiter = rateLimit({
      windowMs: WINDOW_MS,
      max: AppConfig.RATE_LIMIT_MAX_REQUESTS || 10000,
      store: rateLimitStore,
      message: { success: false, error: 'Too many requests. Please slow down.' },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        if (isDev) return true;
        const p = req.path;
        // Skip high-frequency endpoints that are safe and already no-cached
        return p.startsWith('/admin/') ||
               p === '/auth/me' ||
               p === '/notifications/unread-count' ||
               p === '/training/missions';
      },
    });

    // Auth limiter — tight only on login/register to block credential stuffing
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: { success: false, error: 'Too many login attempts. Please wait 15 minutes.' },
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
  private setupRoutes(): void {
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
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundMiddleware);

    // Sentry error handler (must come before custom error handler)
    const { Sentry } = require('./helpers/sentry');
    if (process.env.SENTRY_DSN) {
      this.app.use(Sentry.expressErrorHandler());
    }

    // Error handler (must be last)
    this.app.use(errorMiddleware);
  }

  /**
   * Setup Socket.io events
   */
  private setupSocketEvents(): void {
    this.io.on('connection', (socket: any) => {
      Logger.info(`SOCKET_LINK: Client connected [${socket.id}]`);

      // Handle user join room (specific to userId for cross-device sync)
      socket.on('join_user_room', (userId: string) => {
        if (userId) {
          socket.join(`user_${userId}`);
          Logger.info(`SOCKET_LINK: User ${userId} joined their neural room`);
        }
      });

      socket.on('disconnect', () => {
        Logger.info(`SOCKET_LINK: Client disconnected [${socket.id}]`);
      });
    });

    // Lobby Namespace for real-time Dojo interaction
    const lobbyNamespace = this.io.of('/lobby');
    lobbyNamespace.on('connection', (socket: any) => {
      Logger.info(`DOJO_LOBBY: Operator connected [${socket.id}]`);

      socket.on('join_lobby', async (data: { lobbyId: string; userId: string }) => {
        try {
          const { lobbyId, userId } = data;
          if (!lobbyId || !userId) return;
          socket.join(`lobby_${lobbyId}`);
          socket.lobbyId = lobbyId;
          await this.lobbyService.updateActiveCount(lobbyId, 1);
          // Broadcast updated room size to everyone in the room
          const roomSize = lobbyNamespace.adapter.rooms.get(`lobby_${lobbyId}`)?.size ?? 1;
          lobbyNamespace.to(`lobby_${lobbyId}`).emit('room_size', { lobbyId, count: roomSize });
          lobbyNamespace.to(`lobby_${lobbyId}`).emit('operator_joined', { userId });
          Logger.info(`DOJO_LOBBY: User ${userId} joined room lobby_${lobbyId} (${roomSize} operators)`);
        } catch (err) {
          Logger.error('DOJO_LOBBY: join_lobby error', err);
        }
      });

      socket.on('send_message', async (data: {
        lobbyId: string;
        userId: string;
        content: string;
        intelLink?: any
      }) => {
        try {
          if (!data.lobbyId || !data.userId || !data.content?.trim()) return;
          Logger.info(`DOJO_LOBBY: Message from ${data.userId} to ${data.lobbyId}`);
          const message = await this.lobbyService.saveMessage(data);
          if (message) {
            lobbyNamespace.to(`lobby_${data.lobbyId}`).emit('new_message', message);
          }
        } catch (err) {
          Logger.error('DOJO_LOBBY: send_message error', err);
        }
      });

      socket.on('leave_lobby', async (data: { lobbyId: string; userId: string }) => {
        try {
          const { lobbyId, userId } = data;
          socket.leave(`lobby_${lobbyId}`);
          await this.lobbyService.updateActiveCount(lobbyId, -1);
          const roomSize = lobbyNamespace.adapter.rooms.get(`lobby_${lobbyId}`)?.size ?? 0;
          lobbyNamespace.to(`lobby_${lobbyId}`).emit('room_size', { lobbyId, count: roomSize });
          lobbyNamespace.to(`lobby_${lobbyId}`).emit('operator_left', { userId });
        } catch (err) {
          Logger.error('DOJO_LOBBY: leave_lobby error', err);
        }
      });

      socket.on('disconnect', async () => {
        try {
          if (socket.lobbyId) {
            await this.lobbyService.updateActiveCount(socket.lobbyId, -1);
          }
          Logger.info(`DOJO_LOBBY: Operator disconnected [${socket.id}]`);
        } catch (err) {
          Logger.error('DOJO_LOBBY: disconnect error', err);
        }
      });
    });
  }

  /**
   * Start the application
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      await Database.connect();

      // Run system initialization (auto-seeding & admin setup)
      const startMetaRoutes = this.routes.getMetaRoutes();
      const startMetaService = startMetaRoutes?.getController()?.getMetaService();
      SystemInitializer.run(startMetaService ?? undefined, this.rosterSyncService ?? undefined).catch(err => {
        Logger.error('SYSTEM_INITIALIZATION: Failed during startup', err);
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

      // Seed default lobbies for active games (non-blocking)
      this.lobbyService.seedDefaultLobbies().catch(() => {});

      // Start server
      this.server.listen(AppConfig.PORT, () => {
        Logger.info(`Server running on port ${AppConfig.PORT} in ${AppConfig.NODE_ENV} mode`);
        Logger.info(`API Gateway: http://localhost:${AppConfig.PORT}`);
        Logger.info(`Health check: http://localhost:${AppConfig.PORT}/api/health`);
      });
    } catch (error) {
      Logger.error('Failed to start application', error);
      process.exit(1);
    }
  }

  /**
   * Stop the application
   */
  public async stop(): Promise<void> {
    try {
      if (this.ingestionService) {
        this.ingestionService.stopScheduler();
      }
      await Database.disconnect();
      Logger.info('Application stopped');
    } catch (error) {
      Logger.error('Failed to stop application', error);
    }
  }

  /**
   * Get Express app instance
   */
  public getApp(): Express {
    return this.app;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new App();
  app.start();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    Logger.info('SIGTERM received, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    Logger.info('SIGINT received, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });
}

// Export app for testing
export default App;

