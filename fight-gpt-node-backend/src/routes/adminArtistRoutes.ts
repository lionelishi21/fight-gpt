import { Router } from 'express';
import { AdminArtistController } from '../controllers/AdminArtistController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { adminKeyAuth } from '../middleware/adminKeyAuth';

export class AdminArtistRoutes {
    private router: Router;

    constructor(private readonly controller: AdminArtistController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.use(adminKeyAuth);
        this.router.use(authMiddleware);
        this.router.use(adminMiddleware);

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

    getRouter(): Router {
        return this.router;
    }
}
