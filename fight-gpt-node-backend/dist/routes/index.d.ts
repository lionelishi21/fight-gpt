import { Router } from 'express';
import { ArtistOnboardingController } from '../controllers/ArtistOnboardingController';
import { AdminArtistController } from '../controllers/AdminArtistController';
import { MetaRoutes } from './metaRoutes';
import { AdminController } from '../controllers/AdminController';
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
import { PaymentController } from '../controllers/PaymentController';
import { EngagementController } from '../controllers/EngagementController';
/**
 * Routes configuration
 * Follows Single Responsibility Principle - sets up all routes
 */
export declare class Routes {
    private router;
    private analysisRoutes;
    private healthRoutes;
    private characterRoutes;
    private gameRoutes;
    private gameMetadataRoutes;
    private characterEncyclopediaRoutes;
    private chatRoutes;
    private authRoutes;
    private onboardingRoutes;
    private gamificationRoutes;
    private trainingRoutes;
    private metaRoutes;
    private ingestionRoutes;
    private theoryRoutes;
    private notificationRoutes;
    private rivalRoutes;
    private userRoutes;
    private lobbyRoutes;
    private adminRoutes;
    private paymentRoutes;
    private engagementRoutes;
    private artistOnboardingRoutes;
    private adminArtistRoutes;
    constructor(analysisController: AnalysisController | null, healthController: HealthController | null, characterController: CharacterController | null, gameController: GameController | null, gameMetadataController: GameMetadataController | null, characterEncyclopediaController: CharacterEncyclopediaController | null, chatController: ChatController, metaController?: MetaController | null, theoryController?: TheoryController | null, notificationController?: NotificationController | null, rivalController?: RivalController | null, userController?: UserController | null, adminController?: AdminController | null, paymentController?: PaymentController | null, engagementController?: EngagementController | null);
    /**
     * Setup all routes
     */
    private setupRoutes;
    /**
     * Get main router instance
     */
    getRouter(): Router;
    mountArtistRoutes(artistController: ArtistOnboardingController, adminArtistController: AdminArtistController): void;
    getMetaRoutes(): MetaRoutes | null;
}
//# sourceMappingURL=index.d.ts.map