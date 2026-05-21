import { IAnalysis } from '../models/Analysis';
import User from '../models/User';

/**
 * Service to handle tactical verification of practice missions.
 * Cross-references AI analysis timeline with mission goals.
 */
export class MissionService {
  /**
   * Verifies if an analysis fulfills the requirements of a specific mission.
   * @param analysis The completed AI analysis
   * @param userId The ID of the user who submitted proof
   */
  static async verifyMissionSuccess(analysis: IAnalysis, userId: string): Promise<{ success: boolean; reward_xp: number; skill_up?: string }> {
    const timeline = analysis.analysis.timeline || [];
    const mission = analysis.analysis.daily_mission;

    if (!mission) {
      return { success: false, reward_xp: 0 };
    }

    // Heuristic: Check if the timeline contains events that match the mission's intent
    // e.g. If mission is "Punish Whiffs", check for 'punish' events.
    let successCount = 0;
    const goalLower = (mission.goal || '').toLowerCase();

    for (const event of timeline) {
      const descLower = (event.description || '').toLowerCase();
      
      // Match key tactical keywords
      if (goalLower.includes('punish') && (event.event_type === 'punish_missed' || event.event_type === 'whiff_punish')) successCount++;
      if (goalLower.includes('combo') && event.event_type === 'pro_move') successCount++;
      if (goalLower.includes('defense') && event.event_type === 'neutral_win') successCount++;
      if (goalLower.includes('counter') && descLower.includes('counter')) successCount++;
    }

    // If at least one successful execution of the goal is detected
    if (successCount > 0) {
      // Award XP and Skill Level
      const rewardXp = 50;
      const skillToUp = this.determineSkillUp(mission.goal || '');

      await this.applyRewards(userId, rewardXp, skillToUp);

      return { 
        success: true, 
        reward_xp: rewardXp, 
        skill_up: skillToUp 
      };
    }

    return { success: false, reward_xp: 0 };
  }

  /**
   * Determine which skill should be upgraded based on mission text.
   */
  private static determineSkillUp(goal: string): string {
    const g = goal.toLowerCase();
    if (g.includes('punish') || g.includes('execution') || g.includes('combo')) return 'execution';
    if (g.includes('defense') || g.includes('block') || g.includes('tech')) return 'defense';
    if (g.includes('neutral') || g.includes('spacing') || g.includes('poking')) return 'neutral';
    if (g.includes('knowledge') || g.includes('theory')) return 'knowledge';
    return 'execution'; // Default
  }

  /**
   * Apply XP and Skill upgrades to the user document.
   */
  private static async applyRewards(userId: string, xp: number, skill: string) {
    const user = await User.findById(userId);
    if (!user) return;

    if (!user.gamification) {
      user.gamification = {
        level: 1,
        xp: 0,
        rank: 'ROOKIE',
        missionStreak: 0,
        longestStreak: 0,
        stats: {
          defense: 50,
          execution: 50,
          neutral: 50,
          knowledge: 50,
          resourceManagement: 50
        },
        heatmap: []
      };
    }

    // Update XP
    user.gamification.xp += xp;

    // Handle Level Up - Simple XP growth (Levels are every 500 XP)
    const newLevel = Math.floor(user.gamification.xp / 500) + 1;
    if (newLevel > user.gamification.level) {
        user.gamification.level = newLevel;
    }

    // Update specific skill
    const currentStats = user.gamification.stats;
    const skillKey = skill as keyof typeof currentStats;
    const currentVal = (currentStats as any)[skillKey] || 50;
    (currentStats as any)[skillKey] = Math.min(100, currentVal + 5);
    user.gamification.stats = currentStats;
    user.markModified('gamification.stats');

    await user.save();
  }
}
