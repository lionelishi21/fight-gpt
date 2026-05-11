"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisController = void 0;
const BaseController_1 = require("./BaseController");
/**
 * Analysis controller implementation
 * Follows Single Responsibility Principle - handles HTTP requests/responses for analysis
 * Follows Dependency Inversion Principle - depends on service interface, not implementation
 */
class AnalysisController extends BaseController_1.BaseController {
    analysisService;
    auditLogRepository;
    constructor(analysisService, auditLogRepository) {
        super();
        this.analysisService = analysisService;
        this.auditLogRepository = auditLogRepository;
    }
    /**
     * Analyze video endpoint handler
     * POST /api/analyze
     */
    async analyzeVideo(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const request = req.body;
            // Log request
            console.log(`[AnalysisController] Analyze request: ${JSON.stringify(request)}`);
            // Call service — pass userId so the analysis is tagged to the requesting user
            const userId = req.user?.id;
            const result = await this.analysisService.analyzeVideo(request, userId);
            // Calculate response time
            const responseTime = Date.now() - startTime;
            // Log audit
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/analyze',
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: request,
                response_status: result.success ? 200 : 400,
                response_time_ms: responseTime,
            });
            // Send response
            const statusCode = result.success ? 200 : 400;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            // Log error audit
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/analyze',
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                request_body: req.body,
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[AnalysisController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get analysis by ID endpoint handler
     * GET /api/analysis/:id
     */
    async getAnalysis(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            if (!id) {
                this.sendResponse(res, { success: false, error: 'Analysis ID is required' }, 400);
                return;
            }
            // Call service
            const result = await this.analysisService.getAnalysis(id);
            // Calculate response time
            const responseTime = Date.now() - startTime;
            // Log audit
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/analysis/${id}`,
                method: 'GET',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: result.success ? 200 : 404,
                response_time_ms: responseTime,
            });
            // Send response
            const statusCode = result.success ? 200 : 404;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            // Log error audit
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/analysis/${req.params.id}`,
                method: 'GET',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[AnalysisController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get recent analyses endpoint handler
     * GET /api/analysis/recent
     */
    async getRecentAnalyses(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const gameId = req.query.gameId;
            const userId = req.user?.id;
            // Call service — filter by the signed-in user's ID and optionally gameId
            const result = await this.analysisService.getRecentAnalyses(limit, userId, gameId);
            // Calculate response time
            const responseTime = Date.now() - startTime;
            // Log audit
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/analysis/recent',
                method: 'GET',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: result.success ? 200 : 500,
                response_time_ms: responseTime,
            });
            // Send response
            const statusCode = result.success ? 200 : 500;
            this.sendResponse(res, result, statusCode);
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            // Log error audit
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/analysis/recent',
                method: 'GET',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: 500,
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }).catch((err) => {
                console.error('[AnalysisController] Failed to create audit log:', err);
            });
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get discovery analyses endpoint handler
     * GET /api/analysis/discovery
     */
    async getDiscoveryAnalyses(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const gameId = req.query.gameId;
            const p1Char = req.query.p1_character;
            const p2Char = req.query.p2_character;
            const result = await this.analysisService.getDiscoveryAnalyses(limit, gameId, p1Char, p2Char);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: '/api/analysis/discovery',
                method: 'GET',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: result.success ? 200 : 500,
                response_time_ms: responseTime,
            });
            this.sendResponse(res, result, result.success ? 200 : 500);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Verify mission success for an analysis
     * POST /api/analysis/:id/verify
     */
    async verifyMission(req, res, next) {
        const requestId = this.getRequestId(req);
        const startTime = Date.now();
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!id || !userId) {
                this.sendResponse(res, { success: false, error: 'Analysis ID and User Auth required' }, 400);
                return;
            }
            // 1. Get the analysis
            const result = await this.analysisService.getAnalysis(id);
            if (!result.success || !result.data) {
                this.sendResponse(res, { success: false, error: 'Analysis not found' }, 404);
                return;
            }
            // 2. Run mission verification
            const { MissionService } = require('../services/MissionService');
            const verifyResult = await MissionService.verifyMissionSuccess(result.data, userId);
            const responseTime = Date.now() - startTime;
            await this.auditLogRepository.createAuditLog({
                request_id: requestId,
                endpoint: `/api/analysis/${id}/verify`,
                method: 'POST',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                response_status: 200,
                response_time_ms: responseTime,
            });
            this.sendResponse(res, { success: true, data: verifyResult }, 200);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Track discovery feed views
     * POST /api/analyses/discovery/track-view
     */
    async trackDiscoveryView(req, res, next) {
        try {
            const { analysisIds } = req.body;
            const userId = req.user?.id;
            if (!analysisIds || !Array.isArray(analysisIds)) {
                this.sendResponse(res, { success: false, error: 'analysisIds array required' }, 400);
                return;
            }
            const result = await this.analysisService.trackDiscoveryView(analysisIds);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Track discovery feed clicks
     * POST /api/analyses/discovery/:id/track-click
     */
    async trackDiscoveryClick(req, res, next) {
        try {
            const { id } = req.params;
            const result = await this.analysisService.trackDiscoveryClick(id);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
    /**
     * Get IDs of discovery items already viewed by user
     * GET /api/analyses/discovery/views
     */
    async getUserDiscoveryViews(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                this.sendResponse(res, { success: false, error: 'Unauthorized' }, 401);
                return;
            }
            const result = await this.analysisService.getUserDiscoveryViews(userId);
            this.sendResponse(res, result);
        }
        catch (error) {
            this.handleError(error, req, res, next);
        }
    }
}
exports.AnalysisController = AnalysisController;
//# sourceMappingURL=AnalysisController.js.map