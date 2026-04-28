import { Router, Request, Response } from 'express';
import { Scenario } from '../models/Scenario';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/scenarios
 * List scenarios with optional filters: game_id, character, tag, page, limit
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { game_id, character, tag, page = '1', limit = '20' } = req.query as Record<string, string>;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, any> = {};
        if (game_id) filter.game_id = game_id;
        if (character) filter.characters_involved = character.toLowerCase();
        if (tag) filter.tags = tag;

        const [scenarios, total] = await Promise.all([
            Scenario.find(filter, { embedding: 0 })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean()
                .exec(),
            Scenario.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                scenarios,
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (err) {
        console.error('[ScenarioRoutes] List error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch scenarios' });
    }
});

/**
 * GET /api/scenarios/summary
 * Returns total count grouped by game_id — used by the dashboard stat display
 */
router.get('/summary', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const summary = await (Scenario as any).aggregate([
            { $group: { _id: '$game_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const total = summary.reduce((acc: number, g: any) => acc + g.count, 0);
        res.json({ success: true, data: { total, by_game: summary } });
    } catch (err) {
        console.error('[ScenarioRoutes] Summary error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch scenario summary' });
    }
});

/**
 * GET /api/scenarios/:id
 * Get a single scenario by its scenario_id or MongoDB _id — used by the Tech Detail page
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const scenario = await Scenario.findOne(
            { $or: [{ scenario_id: id }, { _id: id.match(/^[a-f\d]{24}$/i) ? id : null }] },
            { embedding: 0 }
        ).lean().exec();

        if (!scenario) {
            return res.status(404).json({ success: false, error: 'Scenario not found' });
        }
        return res.json({ success: true, data: scenario });
    } catch (err) {
        console.error('[ScenarioRoutes] Get by ID error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch scenario' });
    }
});

export default router;
