"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.premiumMiddleware = exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authMiddleware = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');
    // Check if not token
    if (!token) {
        res.status(401).json({ success: false, error: 'No token, authorization denied' });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // @ts-ignore
        req.user = decoded.user;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, error: 'Token is not valid' });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware
 */
/**
 * Optional auth middleware — sets req.user if valid token present, never blocks
 */
const optionalAuthMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        next();
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'fight-gpt-secret-key-change-in-prod';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded.user;
    }
    catch { /* invalid token — just continue unauthenticated */ }
    next();
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const adminMiddleware = async (req, res, next) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }
        const user = await User_1.default.findById(userId);
        if (!user || user.role !== 'admin') {
            res.status(403).json({ success: false, error: 'Access denied: Admin only' });
            return;
        }
        // Attach full user so controllers can access _id, name, etc.
        req.user = user;
        next();
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server validation error' });
    }
};
exports.adminMiddleware = adminMiddleware;
/**
 * Middleware to check if user has a premium tier (COMPETITOR or PRO)
 * Must be used AFTER authMiddleware
 */
const premiumMiddleware = async (req, res, next) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // Admins and users with COMPETITOR or PRO tier have premium access
        // Case-insensitive to handle any legacy lowercase values from older Stripe webhook handler
        const tier = (user.tier || '').toUpperCase();
        if (user.role === 'admin' || tier === 'COMPETITOR' || tier === 'PRO') {
            // Attach full user for downstream use
            req.user = user;
            next();
        }
        else {
            res.status(403).json({
                success: false,
                error: 'Premium subscription required',
                code: 'PREMIUM_REQUIRED'
            });
        }
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Tier validation error' });
    }
};
exports.premiumMiddleware = premiumMiddleware;
//# sourceMappingURL=auth.js.map