"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MatchController_1 = require("../controllers/MatchController");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
const controller = new MatchController_1.MatchController();
// Validation rules
const createMatchValidation = [
    (0, express_validator_1.body)('game_id').isString().notEmpty().withMessage('game_id is required'),
    (0, express_validator_1.body)('format').isIn(['1v1', '2v2', '3v3']).withMessage('format must be 1v1, 2v2, or 3v3'),
    (0, express_validator_1.body)('player1').isObject().withMessage('player1 is required'),
    (0, express_validator_1.body)('player1.name').isString().notEmpty().withMessage('player1.name is required'),
    (0, express_validator_1.body)('player1.team').isArray().withMessage('player1.team must be an array'),
    (0, express_validator_1.body)('player2').isObject().withMessage('player2 is required'),
    (0, express_validator_1.body)('player2.name').isString().notEmpty().withMessage('player2.name is required'),
    (0, express_validator_1.body)('player2.team').isArray().withMessage('player2.team must be an array'),
    (0, express_validator_1.body)('events').optional().isArray(),
];
const updateMatchValidation = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Valid match ID is required'),
    (0, express_validator_1.body)('game_id').optional().isString(),
    (0, express_validator_1.body)('format').optional().isIn(['1v1', '2v2', '3v3']),
    (0, express_validator_1.body)('winner').optional().isIn(['player1', 'player2', 'draw']),
    (0, express_validator_1.body)('events').optional().isArray()
];
// Routes
// POST /api/matches
router.post('/', createMatchValidation, validationMiddleware_1.validateRequest, controller.createMatch);
// GET /api/matches/game/:gameId
router.get('/game/:gameId', [
    (0, express_validator_1.param)('gameId').isString().notEmpty(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
], validationMiddleware_1.validateRequest, controller.getMatchesByGameId);
// GET /api/matches/player/:playerName
router.get('/player/:playerName', [
    (0, express_validator_1.param)('playerName').isString().notEmpty(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
], validationMiddleware_1.validateRequest, controller.getMatchesByPlayerName);
// GET /api/matches/match-id/:matchId
router.get('/match-id/:matchId', [(0, express_validator_1.param)('matchId').isString().notEmpty()], validationMiddleware_1.validateRequest, controller.getMatchByMatchId);
// GET /api/matches/:id
router.get('/:id', [(0, express_validator_1.param)('id').isMongoId().withMessage('Valid MongoDB ID is required')], validationMiddleware_1.validateRequest, controller.getMatchById);
// PUT /api/matches/:id
router.put('/:id', updateMatchValidation, validationMiddleware_1.validateRequest, controller.updateMatch);
// DELETE /api/matches/:id
router.delete('/:id', [(0, express_validator_1.param)('id').isMongoId().withMessage('Valid MongoDB ID is required')], validationMiddleware_1.validateRequest, controller.deleteMatch);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map