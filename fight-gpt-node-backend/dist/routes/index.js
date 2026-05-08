"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const express_1 = require("express");
const artistOnboardingRoutes_1 = require("./artistOnboardingRoutes");
const adminArtistRoutes_1 = require("./adminArtistRoutes");
const analysisRoutes_1 = require("./analysisRoutes");
const healthRoutes_1 = require("./healthRoutes");
const characterRoutes_1 = require("./characterRoutes");
const gameRoutes_1 = require("./gameRoutes");
const gameMetadataRoutes_1 = require("./gameMetadataRoutes");
const characterEncyclopediaRoutes_1 = require("./characterEncyclopediaRoutes");
const chatRoutes_1 = require("./chatRoutes");
const authRoutes_1 = require("./authRoutes");
const onboardingRoutes_1 = require("./onboardingRoutes");
const gamificationRoutes_1 = require("./gamificationRoutes");
const trainingRoutes_1 = require("./trainingRoutes");
const metaRoutes_1 = require("./metaRoutes");
const theoryRoutes_1 = require("./theoryRoutes");
const notificationRoutes_1 = require("./notificationRoutes");
const rivalRoutes_1 = require("./rivalRoutes");
const userRoutes_1 = require("./userRoutes");
const adminRoutes_1 = require("./adminRoutes");
const paymentRoutes_1 = require("./paymentRoutes");
const engagementRoutes_1 = require("./engagementRoutes");
const InviteController_1 = require("../controllers/InviteController");
const auth_1 = require("../middleware/auth");
const matchRoutes_1 = __importDefault(require("./matchRoutes"));
const tournamentRoutes_1 = __importDefault(require("./tournamentRoutes"));
const analyticsRoutes_1 = __importDefault(require("./analyticsRoutes"));
const scenarioRoutes_1 = __importDefault(require("./scenarioRoutes"));
/**
 * Routes configuration
 * Follows Single Responsibility Principle - sets up all routes
 */
class Routes {
    router;
    analysisRoutes;
    healthRoutes;
    characterRoutes;
    gameRoutes;
    gameMetadataRoutes;
    characterEncyclopediaRoutes;
    chatRoutes;
    authRoutes;
    onboardingRoutes;
    gamificationRoutes;
    trainingRoutes;
    metaRoutes;
    ingestionRoutes;
    theoryRoutes;
    notificationRoutes;
    rivalRoutes;
    userRoutes;
    adminRoutes;
    paymentRoutes;
    engagementRoutes;
    artistOnboardingRoutes = null;
    adminArtistRoutes = null;
    constructor(analysisController, healthController, characterController, gameController, gameMetadataController, characterEncyclopediaController, chatController, metaController, theoryController, notificationController, rivalController, userController, adminController, paymentController, engagementController) {
        this.router = (0, express_1.Router)();
        this.analysisRoutes = analysisController ? new analysisRoutes_1.AnalysisRoutes(analysisController) : null;
        this.healthRoutes = healthController ? new healthRoutes_1.HealthRoutes(healthController) : null;
        this.characterRoutes = characterController ? new characterRoutes_1.CharacterRoutes(characterController) : null;
        this.gameRoutes = gameController ? new gameRoutes_1.GameRoutes(gameController) : null;
        this.gameMetadataRoutes = gameMetadataController ? new gameMetadataRoutes_1.GameMetadataRoutes(gameMetadataController) : null;
        this.characterEncyclopediaRoutes = characterEncyclopediaController ? new characterEncyclopediaRoutes_1.CharacterEncyclopediaRoutes(characterEncyclopediaController) : null;
        this.chatRoutes = new chatRoutes_1.ChatRoutes(chatController);
        this.authRoutes = new authRoutes_1.AuthRoutes();
        this.onboardingRoutes = new onboardingRoutes_1.OnboardingRoutes();
        this.gamificationRoutes = new gamificationRoutes_1.GamificationRoutes();
        this.trainingRoutes = new trainingRoutes_1.TrainingRoutes();
        this.metaRoutes = metaController ? new metaRoutes_1.MetaRoutes(metaController) : null;
        this.ingestionRoutes = metaController ? new metaRoutes_1.IngestionRoutes(metaController) : null;
        this.theoryRoutes = theoryController ? new theoryRoutes_1.TheoryRoutes(theoryController) : null;
        this.notificationRoutes = notificationController ? new notificationRoutes_1.NotificationRoutes(notificationController) : null;
        this.rivalRoutes = rivalController ? new rivalRoutes_1.RivalRoutes(rivalController) : null;
        this.userRoutes = userController ? new userRoutes_1.UserRoutes(userController) : null;
        this.adminRoutes = adminController ? new adminRoutes_1.AdminRoutes(adminController) : null;
        this.paymentRoutes = new paymentRoutes_1.PaymentRoutes(paymentController);
        this.engagementRoutes = new engagementRoutes_1.EngagementRoutes(engagementController);
        this.setupRoutes();
    }
    /**
     * Setup all routes
     */
    setupRoutes() {
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
        // Payment routes
        this.router.use('/payments', this.paymentRoutes.getRouter());
        // Engagement routes
        this.router.use('/engagement', this.engagementRoutes.router);
        // Public invite validation (used on signup page to pre-fill role/email)
        this.router.get('/invites/validate/:token', InviteController_1.inviteController.validateInvite);
        // User referral routes (authenticated)
        this.router.post('/users/referral/invite', auth_1.authMiddleware, InviteController_1.inviteController.sendReferralInvite);
        this.router.get('/users/referral/stats', auth_1.authMiddleware, InviteController_1.inviteController.getReferralStats);
        // Match routes (team-based match analysis - Priority 7)
        this.router.use('/matches', matchRoutes_1.default);
        // Tournament routes
        this.router.use('/tournaments', tournamentRoutes_1.default);
        // Scenario explorer routes (authenticated)
        this.router.use('/scenarios', scenarioRoutes_1.default);
        // Analytics routes (Priority 7.3)
        this.router.use('/analytics', analyticsRoutes_1.default);
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
    getRouter() {
        return this.router;
    }
    mountArtistRoutes(artistController, adminArtistController) {
        this.artistOnboardingRoutes = new artistOnboardingRoutes_1.ArtistOnboardingRoutes(artistController);
        this.adminArtistRoutes = new adminArtistRoutes_1.AdminArtistRoutes(adminArtistController);
        this.router.use('/artist', this.artistOnboardingRoutes.getRouter());
        this.router.use('/admin/artists', this.adminArtistRoutes.getRouter());
    }
    getMetaRoutes() {
        return this.metaRoutes;
    }
}
exports.Routes = Routes;
//# sourceMappingURL=index.js.map