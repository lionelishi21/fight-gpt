"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const BaseController_1 = require("./BaseController");
/**
 * Health controller implementation
 * Follows Single Responsibility Principle - handles health check requests
 */
class HealthController extends BaseController_1.BaseController {
    aiService;
    startTime = Date.now();
    constructor(aiService) {
        super();
        this.aiService = aiService;
    }
    /**
     * Health check endpoint handler
     * GET /api/health
     */
    async checkHealth(req, res) {
        try {
            // Check AI service health
            const aiServiceHealthy = await this.aiService.healthCheck();
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);
            const healthResponse = {
                status: aiServiceHealthy ? 'ok' : 'degraded',
                service: 'fight-gpt-api-gateway',
                timestamp: new Date().toISOString(),
                uptime,
            };
            const apiResponse = {
                success: true,
                data: healthResponse,
            };
            const statusCode = aiServiceHealthy ? 200 : 503;
            this.sendResponse(res, apiResponse, statusCode);
        }
        catch (error) {
            const healthResponse = {
                status: 'error',
                service: 'fight-gpt-api-gateway',
                timestamp: new Date().toISOString(),
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
            };
            const apiResponse = {
                success: false,
                data: healthResponse,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            this.sendResponse(res, apiResponse, 503);
        }
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=HealthController.js.map