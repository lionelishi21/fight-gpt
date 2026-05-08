import { Router } from 'express';
import multer from 'multer';
import { ArtistOnboardingController } from '../controllers/ArtistOnboardingController';
import { authMiddleware } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export class ArtistOnboardingRoutes {
    private router: Router;

    constructor(private readonly controller: ArtistOnboardingController) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.use(authMiddleware);

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

    getRouter(): Router {
        return this.router;
    }
}
