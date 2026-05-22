import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { orgController } from '../controllers/OrgController';

const router = Router();

// @ts-ignore
router.post('/',         authMiddleware, orgController.createOrg);
// @ts-ignore
router.get('/mine',      authMiddleware, orgController.getMyOrg);
// @ts-ignore
router.post('/invite',   authMiddleware, orgController.inviteMember);
// @ts-ignore
router.get('/scout',     authMiddleware, orgController.getScoutingReport);

export default router;
