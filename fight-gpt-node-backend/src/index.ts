import dotenv from 'dotenv';
// Load environment variables before other imports
dotenv.config();

// Sentry must init before any other imports so it can instrument them
import { initSentry } from './helpers/sentry';
initSentry();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

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
import { NotificationService } from './services/NotificationService';
import { AutoResearchService } from './services/AutoResearchService';
import { RivalService } from './services/RivalService';
import { UserService } from './services/UserService';
import { AdminService } from './services/AdminService';
import { TrendAnalysisService } from './services/TrendAnalysisService';
import { PaymentService } from './services/PaymentService';
import { RosterSyncService } from './services/RosterSyncService';
import { ScraperService } from './services/ScraperService';
import { ArtistOnboardingService } from './services/ArtistOnboardingService';
import { AdminArtistService } from './services/AdminArtistService';
import { ArtistOnboardingController } from './controllers/ArtistOnboardingController';
import { AdminArtistController } from './controllers/AdminArtistController';
import { ArtistProfileRepository } from './repositories/ArtistProfileRepository';
import { OnboardingDocumentRepository } from './repositories/OnboardingDocumentRepository';
import { SplitSheetRepository } from './repositories/SplitSheetRepository';
import { TrackSubmissionRepository } from './repositories/TrackSubmissionRepository';
import { AdminArtistReviewRepository } from './repositories/AdminArtistReviewRepository';

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
        origin: AppConfig.CORS_ORIGINS,
        credentials: true
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
    const notificationService = AppConfig.MONGODB_URI ? new NotificationService(notificationRepository) : null as any;
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
    this.ingestionService = AppConfig.MONGODB_URI ? new IngestionService(ingestionRepository, analysisService, metaService, searchStrategyRepository) : null;
    const theoryService = AppConfig.MONGODB_URI ? new TheoryService(theoryRepository, vectorRepository, AppConfig.GEMINI_API_KEY, notificationService) : null as any;
    const rivalService = AppConfig.MONGODB_URI ? new RivalService(rivalRepository) : null as any;
    const userService = AppConfig.MONGODB_URI ? new UserService() : null as any;
    const adminService = AppConfig.MONGODB_URI ? new AdminService() : null as any;
    const scraperService = AppConfig.MONGODB_URI ? new ScraperService(characterEncyclopediaService) : null as any;
    this.rosterSyncService = AppConfig.MONGODB_URI ? new RosterSyncService(scraperService) : null as any;
    const autoResearchService = AppConfig.MONGODB_URI
        ? new AutoResearchService(theoryService, notificationService)
        : null;
    autoResearchService?.start();
    
    const trendAnalysisService = AppConfig.MONGODB_URI
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
      trendAnalysisService ?? undefined,
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

    // Artist onboarding
    const artistProfileRepo = AppConfig.MONGODB_URI ? new ArtistProfileRepository() : null as any;
    const onboardingDocRepo = AppConfig.MONGODB_URI ? new OnboardingDocumentRepository() : null as any;
    const splitSheetRepo = AppConfig.MONGODB_URI ? new SplitSheetRepository() : null as any;
    const trackSubmissionRepo = AppConfig.MONGODB_URI ? new TrackSubmissionRepository() : null as any;
    const adminArtistReviewRepo = AppConfig.MONGODB_URI ? new AdminArtistReviewRepository() : null as any;
    const artistOnboardingService = AppConfig.MONGODB_URI
      ? new ArtistOnboardingService(artistProfileRepo, onboardingDocRepo, splitSheetRepo, trackSubmissionRepo, adminArtistReviewRepo)
      : null as any;
    const adminArtistService = AppConfig.MONGODB_URI
      ? new AdminArtistService(artistProfileRepo, adminArtistReviewRepo, trackSubmissionRepo, onboardingDocRepo)
      : null as any;
    const artistOnboardingController = AppConfig.MONGODB_URI ? new ArtistOnboardingController(artistOnboardingService) : null as any;
    const adminArtistController = AppConfig.MONGODB_URI ? new AdminArtistController(adminArtistService) : null as any;

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
    
    // Mount artist onboarding routes
    if (AppConfig.MONGODB_URI && artistOnboardingController && adminArtistController) {
      this.routes.mountArtistRoutes(artistOnboardingController, adminArtistController);
    }

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
    this.app.use(helmet());

    // CORS middleware
    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = AppConfig.CORS_ORIGINS;
          // allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins === true) {
            callback(null, true);
          } else if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-admin-key'],
      })
    );

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

    // Global rate limiter — applied to all user-facing API routes.
    // Admin routes (/api/admin/) are EXCLUDED: they are protected by
    // the x-admin-key secret header instead, so they never compete
    // with real user traffic for the same IP bucket.
    const limiter = rateLimit({
      windowMs: AppConfig.RATE_LIMIT_WINDOW_MS,
      max: AppConfig.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path.startsWith('/admin/'),
    });

    // Dedicated brute-force limiter for auth routes.
    // Much stricter: 10 attempts per 15 minutes per IP.
    // Applies to login and register independently of the global limiter.
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      message: {
        success: false,
        error: 'Too many login attempts from this IP, please try again in 15 minutes.',
      },
      standardHeaders: true,
      legacyHeaders: false,
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

