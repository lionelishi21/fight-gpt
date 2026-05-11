"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const auth_1 = require("../middleware/auth");
/**
 * Analysis routes
 * Follows Single Responsibility Principle - handles routing for analysis endpoints
 */
class AnalysisRoutes {
    router;
    controller;
    constructor(controller) {
        this.router = (0, express_1.Router)();
        this.controller = controller;
        this.setupRoutes();
    }
    /**
     * Setup routes
     */
    setupRoutes() {
        // POST /api/analyze - Analyze video (optionalAuth tags the analysis to the user)
        this.router.post('/', auth_1.optionalAuthMiddleware, this.validateAnalyzeRequest(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.analyzeVideo(req, res, next));
        // GET /api/analysis/recent - Get recent analyses for the signed-in user only
        this.router.get('/recent', auth_1.optionalAuthMiddleware, validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getRecentAnalyses(req, res, next));
        // GET /api/analysis/discovery - Get all recent analyses (public discovery)
        this.router.get('/discovery', validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getDiscoveryAnalyses(req, res, next));
        // GET /api/analysis/:id - Get analysis by ID
        this.router.get('/:id', this.validateGetAnalysisRequest(), validationMiddleware_1.validateRequest, (req, res, next) => this.controller.getAnalysis(req, res, next));
        // POST /api/analysis/:id/verify - Verify mission success
        this.router.post('/:id/verify', auth_1.optionalAuthMiddleware, validationMiddleware_1.validateRequest, (req, res, next) => this.controller.verifyMission(req, res, next));
        // Engagement Tracking
        this.router.post('/discovery/track-view', auth_1.optionalAuthMiddleware, (req, res, next) => this.controller.trackDiscoveryView(req, res, next));
        this.router.post('/discovery/:id/track-click', (req, res, next) => this.controller.trackDiscoveryClick(req, res, next));
        this.router.get('/discovery/views', auth_1.optionalAuthMiddleware, (req, res, next) => this.controller.getUserDiscoveryViews(req, res, next));
    }
    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
    /**
     * Validation rules for analyze request
     */
    validateAnalyzeRequest() {
        return [
            (0, express_validator_1.body)('youtube_url')
                .optional()
                .isURL()
                .withMessage('youtube_url must be a valid URL')
                .custom((value, { req }) => {
                if (!value && !req.body.video_path) {
                    throw new Error('Either youtube_url or video_path must be provided');
                }
                if (value && req.body.video_path) {
                    throw new Error('Cannot provide both youtube_url and video_path');
                }
                return true;
            }),
            (0, express_validator_1.body)('video_path')
                .optional()
                .isString()
                .withMessage('video_path must be a string'),
            (0, express_validator_1.body)('game_id').optional().isString().withMessage('game_id must be a string'),
        ];
    }
    /**
     * Validation rules for get analysis request
     */
    validateGetAnalysisRequest() {
        return [
            (0, express_validator_1.param)('id')
                .notEmpty()
                .withMessage('Analysis ID is required')
                .custom(v => /^[0-9a-f-]{8,}$/i.test(v))
                .withMessage('Analysis ID must be a valid UUID or MongoDB ObjectId'),
        ];
    }
}
exports.AnalysisRoutes = AnalysisRoutes;
//# sourceMappingURL=analysisRoutes.js.map