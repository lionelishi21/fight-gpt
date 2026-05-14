import { IAnalysisRepository } from '../repositories/AnalysisRepository';
import { NotificationService } from './NotificationService';
import { IGameMetadataService } from './GameMetadataService';
import cron from 'node-cron';
import { Logger } from '../helpers/logger';

/**
 * Service responsible for analyzing trends in discovery data
 * and generating intelligence alerts (Meta Shifts).
 */
export interface ITrendAnalysisService {
  analyzeMetaShifts(): Promise<void>;
  startScheduler(): void;
}

export class TrendAnalysisService implements ITrendAnalysisService {
  constructor(
    private readonly analysisRepository: IAnalysisRepository,
    private readonly notificationService: NotificationService,
    private readonly gameMetadataService: IGameMetadataService
  ) {}

  /**
   * Start the Trend Analysis scheduler (runs daily at 05:00 UTC)
   */
  public startScheduler(): void {
    cron.schedule('0 5 * * *', async () => {
        Logger.info('[TrendAnalysisService] Running nightly meta-shift analysis...');
        await this.analyzeMetaShifts();
    });
    Logger.info('[TrendAnalysisService] Trend Analysis Scheduler started (05:00 daily)');
  }

  /**
   * Run nightly meta-shift analysis
   */
  async analyzeMetaShifts(): Promise<void> {
    console.log('[TrendAnalysisService] Starting Meta-Shift Analysis...');
    
    // 1. Get active games
    const games = await this.gameMetadataService.getActiveGames();
    
    for (const game of games) {
      const gameId = game.game_id;
      
      // 2. Calculate baseline (last 30 days) vs spike (last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // We'll use a simplified approach: count occurrences of each character
      const recentAnalyses = await this.analysisRepository.getDiscoveryAnalyses(200, gameId);
      
      if (recentAnalyses.length < 10) continue; // Not enough data

      const charCounts: Record<string, number> = {};
      const total = recentAnalyses.length;

      recentAnalyses.forEach(a => {
        const p1 = a.analysis?.p1_character;
        const p2 = a.analysis?.p2_character;
        if (p1) charCounts[p1] = (charCounts[p1] || 0) + 1;
        if (p2) charCounts[p2] = (charCounts[p2] || 0) + 1;
      });

      // Find character with highest frequency in recent data
      let topChar = '';
      let maxCount = 0;
      for (const [char, count] of Object.entries(charCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topChar = char;
        }
      }

      const frequency = (maxCount / (total * 2)) * 100; // Frequency as % of all character slots

      // 3. If a character appears in >25% of recent matches, trigger a Meta Alert
      if (frequency > 25) {
        console.log(`[TrendAnalysisService] Meta shift detected for ${topChar} in ${gameId} (${frequency.toFixed(1)}%)`);
        
        await this.notificationService.broadcast(
          'META_SHIFT',
          {
            title: `META ALERT: ${topChar} Dominating`,
            description: `${topChar} has appeared in ${frequency.toFixed(0)}% of recent high-level matches. Watch now to learn the counter-play.`,
            gameId: gameId,
            characterId: topChar,
            link: `analysis/discovery?p1_character=${encodeURIComponent(topChar)}`
          },
          'high'
        );
      }
    }
    
    console.log('[TrendAnalysisService] Meta-Shift Analysis complete.');
  }
}
