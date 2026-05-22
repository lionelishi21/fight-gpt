import { Router, Request, Response } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth';
import { authMiddleware } from '../middleware/auth';
import { publicApiController } from '../controllers/PublicApiController';
import { apiKeyController } from '../controllers/ApiKeyController';

const router = Router();

// ── API Key management (authenticated users) ──────────────────────────────────
// @ts-ignore
router.post('/api-keys',           authMiddleware, apiKeyController.createKey);
// @ts-ignore
router.get('/api-keys',            authMiddleware, apiKeyController.listKeys);
// @ts-ignore
router.delete('/api-keys/:prefix', authMiddleware, apiKeyController.revokeKey);

// ── Public Data API v1 (API key required) ─────────────────────────────────────
const v1 = Router();
v1.use(apiKeyAuth as any);

v1.get('/games',                         publicApiController.listGames);
v1.get('/characters/:gameId',            publicApiController.listCharacters);
v1.get('/frame-data/:gameId/:characterId', publicApiController.getFrameData);
v1.get('/theories/:gameId/:characterId', publicApiController.getTheory);
v1.get('/scenarios/:gameId',             publicApiController.getScenarios);
v1.get('/tier-list/:gameId',             publicApiController.getTierList);

router.use('/v1', v1);

export default router;
