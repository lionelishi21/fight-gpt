import { Router } from 'express';
import { MatchController } from '../controllers/MatchController';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const controller = new MatchController();

// Validation rules
const createMatchValidation = [
    body('game_id').isString().notEmpty().withMessage('game_id is required'),
    body('format').isIn(['1v1', '2v2', '3v3']).withMessage('format must be 1v1, 2v2, or 3v3'),
    body('player1').isObject().withMessage('player1 is required'),
    body('player1.name').isString().notEmpty().withMessage('player1.name is required'),
    body('player1.team').isArray().withMessage('player1.team must be an array'),
    body('player2').isObject().withMessage('player2 is required'),
    body('player2.name').isString().notEmpty().withMessage('player2.name is required'),
    body('player2.team').isArray().withMessage('player2.team must be an array'),
    body('events').optional().isArray(),
];

const updateMatchValidation = [
    param('id').isMongoId().withMessage('Valid match ID is required'),
    body('game_id').optional().isString(),
    body('format').optional().isIn(['1v1', '2v2', '3v3']),
    body('winner').optional().isIn(['player1', 'player2', 'draw']),
    body('events').optional().isArray()
];

// Routes
// POST /api/matches
router.post(
    '/',
    createMatchValidation,
    validateRequest,
    controller.createMatch
);

// GET /api/matches/game/:gameId
router.get(
    '/game/:gameId',
    [
        param('gameId').isString().notEmpty(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    validateRequest,
    controller.getMatchesByGameId
);

// GET /api/matches/player/:playerName
router.get(
    '/player/:playerName',
    [
        param('playerName').isString().notEmpty(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    validateRequest,
    controller.getMatchesByPlayerName
);

// GET /api/matches/match-id/:matchId
router.get(
    '/match-id/:matchId',
    [param('matchId').isString().notEmpty()],
    validateRequest,
    controller.getMatchByMatchId
);

// GET /api/matches/:id
router.get(
    '/:id',
    [param('id').isMongoId().withMessage('Valid MongoDB ID is required')],
    validateRequest,
    controller.getMatchById
);

// PUT /api/matches/:id
router.put(
    '/:id',
    updateMatchValidation,
    validateRequest,
    controller.updateMatch
);

// DELETE /api/matches/:id
router.delete(
    '/:id',
    [param('id').isMongoId().withMessage('Valid MongoDB ID is required')],
    validateRequest,
    controller.deleteMatch
);

export default router;
