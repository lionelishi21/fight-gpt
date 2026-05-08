"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminArtistRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminKeyAuth_1 = require("../middleware/adminKeyAuth");
class AdminArtistRoutes {
    controller;
    router;
    constructor(controller) {
        this.controller = controller;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.use(adminKeyAuth_1.adminKeyAuth);
        this.router.use(auth_1.authMiddleware);
        this.router.use(auth_1.adminMiddleware);
        // Artist list
        this.router.get('/', this.controller.listArtists);
        this.router.get('/queue', this.controller.getQueue);
        // Review workflow
        this.router.get('/reviews/:reviewId', this.controller.getReviewDetail);
        this.router.post('/reviews/:reviewId/assign', this.controller.assignReview);
        this.router.post('/reviews/:reviewId/comment', this.controller.addComment);
        this.router.patch('/reviews/:reviewId/checklist/:index', this.controller.updateChecklist);
        this.router.post('/reviews/:reviewId/approve', this.controller.approveArtist);
        this.router.post('/reviews/:reviewId/reject', this.controller.rejectArtist);
        this.router.post('/reviews/:reviewId/more-info', this.controller.requestMoreInfo);
        // Track review
        this.router.get('/tracks/pending', this.controller.getPendingTracks);
        this.router.post('/tracks/:trackId/approve', this.controller.approveTrack);
        this.router.post('/tracks/:trackId/reject', this.controller.rejectTrack);
    }
    getRouter() {
        return this.router;
    }
}
exports.AdminArtistRoutes = AdminArtistRoutes;
//# sourceMappingURL=adminArtistRoutes.js.map