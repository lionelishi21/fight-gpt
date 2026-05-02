"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
/**
 * Base controller class
 * Follows Single Responsibility Principle - provides common controller functionality
 * Follows Open/Closed Principle - can be extended without modification
 */
class BaseController {
    /**
     * Handle errors consistently
     */
    handleError(error, req, res, _next) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const statusCode = this.getErrorStatusCode(error);
        console.error(`[Controller Error] ${req.method} ${req.path}:`, errorMessage);
        this.sendResponse(res, { success: false, error: errorMessage }, statusCode);
    }
    /**
     * Send standardized API response
     */
    /**
     * Send standardized API response
     */
    sendResponse(res, data, statusCode = 200) {
        res.status(statusCode).json(data);
    }
    /**
     * Send error response
     */
    sendError(res, message, statusCode = 500) {
        this.sendResponse(res, { success: false, error: message }, statusCode);
    }
    /**
     * Get appropriate HTTP status code from error
     */
    getErrorStatusCode(error) {
        if (error instanceof Error) {
            if (error.message.includes('not found'))
                return 404;
            if (error.message.includes('invalid') || error.message.includes('validation'))
                return 400;
            if (error.message.includes('unauthorized') || error.message.includes('forbidden'))
                return 403;
        }
        return 500;
    }
    /**
     * Get request ID from headers or generate new one
     */
    getRequestId(req) {
        return req.headers['x-request-id'] || this.generateRequestId();
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map