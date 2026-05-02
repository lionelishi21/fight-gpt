"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnalyticsController_1 = require("../controllers/AnalyticsController");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
const controller = new AnalyticsController_1.AnalyticsController();
// Record a manual analytics event
router.post('/events', [
    (0, express_validator_1.body)('event_type').isIn(['game_metadata_query', 'character_encyclopedia_query', 'game_rule_query', 'analyze_video']).withMessage('Invalid event_type'),
    (0, express_validator_1.body)('game_id').isString().notEmpty().withMessage('game_id is required')
], validationMiddleware_1.validateRequest, controller.recordEvent);
// Get popular game rules querying across the app
router.get('/popular-rules', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('gameId').optional().isString()
], validationMiddleware_1.validateRequest, controller.getMostQueriedRules);
// Get popular characters being queried
router.get('/popular-characters', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('gameId').optional().isString()
], validationMiddleware_1.validateRequest, controller.getMostQueriedCharacters);
// Get overall event types aggregated
router.get('/event-counts', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
], validationMiddleware_1.validateRequest, controller.getEventCountsByType);
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map