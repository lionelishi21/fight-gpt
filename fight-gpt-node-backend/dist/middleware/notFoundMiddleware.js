"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = void 0;
/**
 * Not found middleware
 * Follows Single Responsibility Principle - handles 404 errors
 */
const notFoundMiddleware = (req, res) => {
    const response = {
        success: false,
        error: `Route not found: ${req.method} ${req.path}`,
    };
    res.status(404).json(response);
};
exports.notFoundMiddleware = notFoundMiddleware;
//# sourceMappingURL=notFoundMiddleware.js.map