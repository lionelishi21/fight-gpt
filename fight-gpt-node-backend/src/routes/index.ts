import { Router } from 'express';
import { AnalysisRoutes } from './analysisRoutes';
import { HealthRoutes } from './healthRoutes';
import { CharacterRoutes } from './characterRoutes';
import { GameRoutes } from './gameRoutes';
import { GameMetadataRoutes } from './gameMetadataRoutes';
import { CharacterEncyclopediaRoutes } from './characterEncyclopediaRoutes';
import { ChatRoutes } from './chatRoutes';
import { AuthRoutes } from './authRoutes';
import { OnboardingRoutes } from './onboardingRoutes';
import { GamificationRoutes } from './gamificationRoutes';
import { TrainingRoutes } from './trainingRoutes';
import { MetaRoutes, IngestionRoutes } from './metaRoutes';
import { TheoryRoutes } from './theoryRoutes';
import { NotificationRoutes } from './notificationRoutes';
import { RivalRoutes } from './rivalRoutes';
import { UserRoutes } from './userRoutes';
import { AdminRoutes } from './adminRoutes';
import { AdminController } from '../controllers/AdminController';
import matchRouter from './matchRoutes';
import analyticsRouter from './analyticsRoutes';
import { AnalysisController } from '../controllers/AnalysisController';
import { HealthController } from '../controllers/HealthController';
import { CharacterController } from '../controllers/CharacterController';
import { GameController } from '../controllers/GameController';
import { GameMetadataController } from '../controllers/GameMetadataController';
import { CharacterEncyclopediaController } from '../controllers/CharacterEncyclopediaController';
import { ChatController } from '../controllers/ChatController';
import { MetaController } from '../controllers/MetaController';
import { TheoryController } from '../controllers/TheoryController';
import { NotificationController } from '../controllers/NotificationController';
import { RivalController } from '../controllers/RivalController';
import { UserController } from '../controllers/UserController';

/**
 * Routes configuration
 * Follows Single Responsibility Principle - sets up all routes
 */
export class Routes {
  private router: Router;
  private analysisRoutes: AnalysisRoutes | null;
  private healthRoutes: HealthRoutes | null;
  private characterRoutes: CharacterRoutes | null;
  private gameRoutes: GameRoutes | null;
  private gameMetadataRoutes: GameMetadataRoutes | null;
  private characterEncyclopediaRoutes: CharacterEncyclopediaRoutes | null;
  private chatRoutes: ChatRoutes;
  private authRoutes: AuthRoutes;
  private onboardingRoutes: OnboardingRoutes;
  private gamificationRoutes: GamificationRoutes;
  private trainingRoutes: TrainingRoutes;
  private metaRoutes: MetaRoutes | null;
  private ingestionRoutes: IngestionRoutes | null;
  private theoryRoutes: TheoryRoutes | null;
  private notificationRoutes: NotificationRoutes | null;
  private rivalRoutes: RivalRoutes | null;
  private userRoutes: UserRoutes | null;
  private adminRoutes: AdminRoutes | null;

  constructor(
    analysisController: AnalysisController | null,
    healthController: HealthController | null,
    characterController: CharacterController | null,
    gameController: GameController | null,
    gameMetadataController: GameMetadataController | null,
    characterEncyclopediaController: CharacterEncyclopediaController | null,
    chatController: ChatController,
    metaController?: MetaController | null,
    theoryController?: TheoryController | null,
    notificationController?: NotificationController | null,
    rivalController?: RivalController | null,
    userController?: UserController | null,
    adminController?: AdminController | null,
  ) {
    this.router = Router();
    this.analysisRoutes = analysisController ? new AnalysisRoutes(analysisController) : null as any;
    this.healthRoutes = healthController ? new HealthRoutes(healthController) : null as any;
    this.characterRoutes = characterController ? new CharacterRoutes(characterController) : null as any;
    this.gameRoutes = gameController ? new GameRoutes(gameController) : null as any;
    this.gameMetadataRoutes = gameMetadataController ? new GameMetadataRoutes(gameMetadataController) : null as any;
    this.characterEncyclopediaRoutes = characterEncyclopediaController ? new CharacterEncyclopediaRoutes(characterEncyclopediaController) : null as any;
    this.chatRoutes = new ChatRoutes(chatController);
    this.authRoutes = new AuthRoutes();
    this.onboardingRoutes = new OnboardingRoutes();
    this.gamificationRoutes = new GamificationRoutes();
    this.trainingRoutes = new TrainingRoutes();
    this.metaRoutes = metaController ? new MetaRoutes(metaController) : null;
    this.ingestionRoutes = metaController ? new IngestionRoutes(metaController) : null;
    this.theoryRoutes = theoryController ? new TheoryRoutes(theoryController) : null;
    this.notificationRoutes = notificationController ? new NotificationRoutes(notificationController) : null;
    this.rivalRoutes = rivalController ? new RivalRoutes(rivalController) : null;
    this.userRoutes = userController ? new UserRoutes(userController) : null;
    this.adminRoutes = adminController ? new AdminRoutes(adminController) : null;
    this.setupRoutes();
  }

  /**
   * Setup all routes
   */
  private setupRoutes(): void {
    // Auth routes
    this.router.use('/auth', this.authRoutes.getRouter());
    // Onboarding routes
    this.router.use('/onboarding', this.onboardingRoutes.getRouter());
    // Gamification routes
    this.router.use('/gamification', this.gamificationRoutes.getRouter());
    // Training routes
    this.router.use('/training', this.trainingRoutes.getRouter());
    // Health check route (optional - may not work without MongoDB)
    if (this.healthRoutes) {
      this.router.use('/health', this.healthRoutes.getRouter());
    }

    // Analysis routes (requires MongoDB)
    if (this.analysisRoutes) {
      this.router.use('/analyze', this.analysisRoutes.getRouter());
      this.router.use('/analysis', this.analysisRoutes.getRouter());
    }

    // Character routes (requires MongoDB)
    if (this.characterRoutes) {
      this.router.use('/characters', this.characterRoutes.getRouter());
    }

    // Game routes (requires MongoDB)
    if (this.gameRoutes) {
      this.router.use('/games', this.gameRoutes.getRouter());
    }

    // Game Metadata routes (requires MongoDB)
    if (this.gameMetadataRoutes) {
      this.router.use('/', this.gameMetadataRoutes.getRouter());
    }

    // Character Encyclopedia routes (requires MongoDB)
    if (this.characterEncyclopediaRoutes) {
      this.router.use('/', this.characterEncyclopediaRoutes.getRouter());
    }

    // Chat routes (works without MongoDB - only needs Gemini API)
    this.router.use('/chat', this.chatRoutes.getRouter());

    // Meta intelligence routes (requires MongoDB)
    if (this.metaRoutes) {
      this.router.use('/meta', this.metaRoutes.getRouter());
    }

    // Ingestion routes (requires MongoDB)
    if (this.ingestionRoutes) {
      this.router.use('/ingestion', this.ingestionRoutes.getRouter());
    }

    // Theory generation routes (requires MongoDB)
    if (this.theoryRoutes) {
      this.router.use('/theory', this.theoryRoutes.getRouter());
    }

    // Notification routes (requires MongoDB)
    if (this.notificationRoutes) {
      this.router.use('/notifications', this.notificationRoutes.getRouter());
    }

    // Rival Watch routes
    if (this.rivalRoutes) {
      this.router.use('/rivals', this.rivalRoutes.getRouter());
    }

    // User/Slot management routes
    if (this.userRoutes) {
      this.router.use('/users', this.userRoutes.getRouter());
    }

    // Admin routes
    if (this.adminRoutes) {
      this.router.use('/admin', this.adminRoutes.getRouter());
    }

    // Match routes (team-based match analysis - Priority 7)
    this.router.use('/matches', matchRouter);

    // Analytics routes (Priority 7.3)
    this.router.use('/analytics', analyticsRouter);

    // Basic health check that works without MongoDB
    this.router.get('/health', (_req, res) => {
      res.json({
        success: true,
        message: 'Fight GPT API is running',
        mode: this.healthRoutes ? 'full' : 'chat-only',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Get main router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}

