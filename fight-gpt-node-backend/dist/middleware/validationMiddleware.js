"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation middleware
 * Follows Single Responsibility Principle - handles request validation
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg).join(', ');
        const response = {
            success: false,
            error: `Validation failed: ${errorMessages}`,
        };
        res.status(400).json(response);
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validationMiddleware.js.map