import { Router } from 'express';
import { TournamentController } from '../controllers/tournamentController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export function createTournamentRouter(controller: TournamentController): Router {
    const router = Router();

    // Public
    router.get('/',           controller.getUpcoming);
    router.get('/completed',  controller.getCompleted);
    router.get('/:id',        controller.getResults);

    // Admin — sync & ingest
    router.post('/sync',             authMiddleware, adminMiddleware, controller.syncFromStartGg);
    router.post('/:id/sync-results', authMiddleware, adminMiddleware, controller.syncResults);
    router.post('/:id/queue-vods',   authMiddleware, adminMiddleware, controller.queueVods);

    return router;
}
