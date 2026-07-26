import { Router, Request, Response } from 'express';
import { MetaController } from '../controllers/MetaController';

export class DiscordRoutes {
  private router: Router;

  constructor(
    private metaController: MetaController
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Phase 3: Discord Bot Integration

    // Command: /analyze [youtube_url]
    this.router.post('/analyze', async (req: Request, res: Response) => {
      try {
        const { url, gameId = 'sf6', requestedBy } = req.body;
        
        if (!url) {
          res.status(400).json({ error: 'URL is required' });
          return;
        }

        // We use the MetaController's getMetaService to get IngestionService indirectly if needed
        // Or we can just mock the response for now, the actual bot would queue it.
        // For simplicity, assume the discord bot just logs it.
        res.status(200).json({
          message: `Analysis queued for ${url}`,
          status: 'pending',
          requestedBy
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // Command: /meta [game]
    this.router.get('/meta/:gameId', async (req: Request, res: Response) => {
      try {
        const { gameId } = req.params;
        const report = await this.metaController.getMetaService().getLatestMetaReport(gameId, 'weekly');
        
        if (!report.success || !report.data) {
          res.status(404).json({ error: 'Meta report not found' });
          return;
        }

        res.status(200).json({
          gameId,
          reportText: `**${report.data.game_id.toUpperCase()} Meta Report (${report.data.period})**\n${report.data.meta_summary.substring(0, 1500)}...`,
          url: `https://fightingames.io/meta/${gameId}`
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
