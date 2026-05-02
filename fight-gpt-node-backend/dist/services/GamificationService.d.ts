import { IUser } from '../models/User';
export declare class GamificationService {
    /**
     * Calculate level based on total XP
     * Formula: Level = floor(sqrt(XP / 100)) + 1
     * Example:
     * 0 XP = Level 1
     * 100 XP = Level 2
     * 400 XP = Level 3
     * 900 XP = Level 4
     */
    calculateLevel(xp: number): number;
    /**
     * Calculate XP required for next level
     */
    calculateNextLevelXp(currentLevel: number): number;
    /**
     * Get user gamification stats
     */
    getUserStats(userId: string): Promise<{
        nextLevelXp: number;
        xp: number;
        level: number;
        rank: string;
        stats: {
            defense: number;
            execution: number;
            neutral: number;
            knowledge: number;
            resourceManagement: number;
        };
        heatmap: {
            date: Date;
            value: number;
        }[];
    }>;
    /**
     * Add XP to user and handle level up
     */
    addXp(userId: string, amount: number): Promise<{
        xp: number;
        level: number;
        rank: string;
        stats: {
            defense: number;
            execution: number;
            neutral: number;
            knowledge: number;
            resourceManagement: number;
        };
        heatmap: {
            date: Date;
            value: number;
        }[];
    }>;
    /**
     * Update user fighting stats (e.g. after analysis)
     */
    updateStats(userId: string, newStats: Partial<IUser['gamification']['stats']>): Promise<{
        defense: number;
        execution: number;
        neutral: number;
        knowledge: number;
        resourceManagement: number;
    }>;
    /**
     * Internal: Record activity for heatmap
     */
    private recordActivity;
}
//# sourceMappingURL=GamificationService.d.ts.map