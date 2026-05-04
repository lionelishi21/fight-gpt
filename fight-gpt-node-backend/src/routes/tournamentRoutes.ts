import { Router } from 'express';
import { getUpcomingTournaments } from '../controllers/tournamentController';

const router = Router();

router.get('/', getUpcomingTournaments);

export default router;
