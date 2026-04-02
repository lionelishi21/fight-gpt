import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const controller = new AnalyticsController();

// Record a manual analytics event
router.post(
    '/events',
    [
        body('event_type').isIn(['game_metadata_query', 'character_encyclopedia_query', 'game_rule_query', 'analyze_video']).withMessage('Invalid event_type'),
        body('game_id').isString().notEmpty().withMessage('game_id is required')
    ],
    validateRequest,
    controller.recordEvent
);

// Get popular game rules querying across the app
router.get(
    '/popular-rules',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('gameId').optional().isString()
    ],
    validateRequest,
    controller.getMostQueriedRules
);

// Get popular characters being queried
router.get(
    '/popular-characters',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('gameId').optional().isString()
    ],
    validateRequest,
    controller.getMostQueriedCharacters
);

// Get overall event types aggregated
router.get(
    '/event-counts',
    [
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    validateRequest,
    controller.getEventCountsByType
);

export default router;
