import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IMetaService } from '../services/MetaService';
import { IIngestionService } from '../services/IngestionService';
import { Scenario } from '../models/Scenario';

export class MetaController extends BaseController {
    constructor(
        private readonly metaService: IMetaService,
        private readonly ingestionService: IIngestionService,
    ) {
        super();
    }

    public getMetaService(): IMetaService {
        return this.metaService;
    }

    /**
     * GET /api/meta/:gameId
     * Get the latest meta report for a game
     */
    getLatestMetaReport = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { period } = req.query as { period?: string };
            const result = await this.metaService.getLatestMetaReport(gameId, period);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/meta/:gameId/generate
     * Trigger meta report generation for a game
     */
    generateMetaReport = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { period } = req.body as { period?: 'weekly' | 'patch' | 'monthly' };
            const result = await this.metaService.generateMetaReport(gameId, period || 'weekly');
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * GET /api/meta/:gameId/history
     * Get historical meta reports for a game
     */
    getMetaHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await this.metaService.getMetaReportHistory(gameId, limit);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * GET /api/meta/:gameId/query?q=...
     * Semantic meta query — natural language question about the meta
     */
    queryMetaInsight = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gameId } = req.params;
            const { q } = req.query as { q?: string };
            if (!q) {
                res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
                return;
            }
            const result = await this.metaService.queryMetaInsight(gameId, q);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/ingestion/trigger
     * Manually trigger video ingestion for a game
     */
    triggerIngestion = async (req: Request, res: Response): Promise<void> => {
        try {
            const { game_id, max_videos } = req.body as { game_id: string; max_videos?: number };
            if (!game_id) {
                res.status(400).json({ success: false, error: 'game_id is required' });
                return;
            }
            const result = await this.ingestionService.triggerIngestion(game_id, max_videos || 5);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/ingestion/process
     * Process the pending ingestion queue
     */
    processQueue = async (req: Request, res: Response): Promise<void> => {
        try {
            const { game_id, batch_size } = req.body as { game_id?: string; batch_size?: number };
            const result = await this.ingestionService.processQueue(game_id, batch_size || 3);
            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Unknown error');
        }
    };

    /**
     * POST /api/meta/backfill-characters
     * One-shot migration: scan scenarios with empty characters_involved and populate
     * them by extracting character names from context/description text.
     * Secured by INTERNAL_WEBHOOK_SECRET header.
     */
    backfillCharacters = async (req: Request, res: Response): Promise<void> => {
        const secret = req.headers['x-backfill-secret'] as string;
        if (!secret || secret !== (process.env.INTERNAL_WEBHOOK_SECRET || 'backfill-2026')) {
            res.status(403).json({ success: false, error: 'Forbidden' });
            return;
        }

        const KNOWN: Record<string, string[]> = {
            sf6: ['ryu','ken','chun-li','guile','cammy','juri','kimberly','manon','dee_jay','jp',
                  'lily','marisa','rashid','aki','ed','akuma','m_bison','bison','terry','honda',
                  'dhalsim','blanka','zangief','luke','jamie','sagat','vega','balrog','cody','poison'],
            tekken8: ['kazuya','jin','paul','law','king','yoshimitsu','nina','hwoarang','xiaoyu',
                      'heihachi','devil_jin','asuka','lili','lars','alisa','lee','steve','dragunov',
                      'victor','reina','azucena','raven','leo'],
            ggst: ['sol','ky','may','axl','chipp','potemkin','faust','millia','zato','ramlethal',
                   'leo','nagoriyuki','giovanna','anji','happy_chaos','baiken','testament','bridget'],
            mk1: ['scorpion','sub-zero','liu_kang','kung_lao','kitana','mileena','raiden','baraka',
                  'johnny_cage','kenshi','reptile','shang_tsung','geras','sindel','havik','smoke',
                  'rain','reiko','general_shao','tanya','ashrah'],
        };

        function extractFromText(text: string, gameId: string): string[] {
            const chars = KNOWN[gameId] || [];
            const lower = text.toLowerCase();
            const found = new Set<string>();
            for (const name of chars) {
                const esc = name.replace(/[-]/g, '[-_]?');
                if (new RegExp(`(?<![a-z_])${esc}(?![a-z_])`, 'i').test(lower)) found.add(name);
            }
            return Array.from(found);
        }

        try {
            const gameId = req.body.game_id as string | undefined;
            const filter: Record<string, any> = { characters_involved: { $size: 0 } };
            if (gameId) filter.game_id = gameId;

            const scenarios = await Scenario.find(filter, {
                _id: 1, game_id: 1, context: 1, description: 1
            }).lean();

            let updated = 0;
            let skipped = 0;
            const ops: any[] = [];

            for (const s of scenarios) {
                const chars = extractFromText(
                    `${(s as any).context || ''} ${(s as any).description || ''}`,
                    (s as any).game_id || ''
                );
                if (chars.length === 0) { skipped++; continue; }
                ops.push({
                    updateOne: {
                        filter: { _id: s._id },
                        update: { $set: { characters_involved: chars } }
                    }
                });
                updated++;
            }

            if (ops.length > 0) await Scenario.bulkWrite(ops);

            this.sendResponse(res, {
                success: true,
                data: { scanned: scenarios.length, updated, skipped },
                message: `Backfill complete: ${updated} updated, ${skipped} had no extractable characters`,
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Backfill failed');
        }
    };
}
