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
import { PaymentService } from './services/PaymentService';

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
  private routes: Routes;
  private ingestionService: InstanceType<typeof IngestionService> | null = null;

  constructor() {
    // Validate configuration
    AppConfig.validate();

    // Initialize Express app
    this.app = express();

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
    const metaService = AppConfig.MONGODB_URI ? new MetaService(metaRepository, vectorRepository, AppConfig.GEMINI_API_KEY) : null as any;
    this.ingestionService = AppConfig.MONGODB_URI ? new IngestionService(ingestionRepository, analysisService) : null;
    const theoryService = AppConfig.MONGODB_URI ? new TheoryService(theoryRepository, vectorRepository, AppConfig.GEMINI_API_KEY, notificationService) : null as any;
    const rivalService = AppConfig.MONGODB_URI ? new RivalService(rivalRepository) : null as any;
    const userService = AppConfig.MONGODB_URI ? new UserService() : null as any;
    const adminService = AppConfig.MONGODB_URI ? new AdminService() : null as any;
    const autoResearchService = AppConfig.MONGODB_URI
        ? new AutoResearchService(theoryService, notificationService)
        : null;
    autoResearchService?.start();
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
    const adminController = AppConfig.MONGODB_URI ? new AdminController(adminService, this.ingestionService ?? undefined, metaService ?? undefined, autoResearchService ?? undefined) : null;
    const paymentService = new PaymentService();
    const paymentController = new PaymentController(paymentService);

    // Setup routes
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
      paymentController
    );
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
        origin: AppConfig.CORS_ORIGIN === '*' ? true : AppConfig.CORS_ORIGIN,
        credentials: true,
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

    // Rate limiting middleware
    const limiter = rateLimit({
      windowMs: AppConfig.RATE_LIMIT_WINDOW_MS,
      max: AppConfig.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);
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
        version: '1.0.0',
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
   * Start the application
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      await Database.connect();

      // Run system initialization (auto-seeding & admin setup)
      await SystemInitializer.run();

      // Start ingestion scheduler (every 6 hours)
      if (this.ingestionService) {
        this.ingestionService.startScheduler();
      }

      // Start server
      this.app.listen(AppConfig.PORT, () => {
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

