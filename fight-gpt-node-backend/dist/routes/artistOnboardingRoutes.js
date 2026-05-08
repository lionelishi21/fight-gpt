"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistOnboardingRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
class ArtistOnboardingRoutes {
    controller;
    router;
    constructor(controller) {
        this.controller = controller;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.use(auth_1.authMiddleware);
        // Profile
        this.router.get('/profile', this.controller.getProfile);
        this.router.put('/profile/step/:step', this.controller.saveStep);
        this.router.post('/profile/submit', this.controller.submitForReview);
        // Documents
        this.router.get('/documents', this.controller.getDocuments);
        this.router.post('/documents', upload.single('file'), this.controller.uploadDocument);
        // Tracks
        this.router.get('/tracks', this.controller.getTracks);
        this.router.post('/tracks', this.controller.submitTrack);
        // Split sheets
        this.router.post('/split-sheets', this.controller.saveSplitSheet);
    }
    getRouter() {
        return this.router;
    }
}
exports.ArtistOnboardingRoutes = ArtistOnboardingRoutes;
//# sourceMappingURL=artistOnboardingRoutes.js.map