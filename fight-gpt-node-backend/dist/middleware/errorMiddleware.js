"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
/**
 * Error middleware
 * Follows Single Responsibility Principle - handles all unhandled errors
 */
const errorMiddleware = (error, req, res, next) => {
    console.error('[Error Middleware] Unhandled error:', error);
    const response = {
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
    };
    res.status(500).json(response);
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=errorMiddleware.js.map