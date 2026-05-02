export declare class TrainingService {
    private gamificationService;
    constructor();
    /**
     * Get missions for a user (Daily rotation + their status)
     * For this MVP, we return all active missions or a random subset.
     */
    getMissionsForUser(userId: string): Promise<{
        id: import("mongoose").Types.ObjectId;
        title: string;
        description: string;
        type: "DRILL" | "MATCHUP" | "KNOWLEDGE";
        difficulty: "EASY" | "MEDIUM" | "HARD";
        reward: string;
        rewardValue: number;
        targetLink: string;
        status: string;
        completed: boolean;
    }[]>;
    /**
     * Complete a mission manually (e.g. user clicks "Claim" or "I did this")
     */
    completeMission(userId: string, missionId: string): Promise<{
        success: boolean;
        missionId: string;
        status: string;
        rewardedXp: number;
    }>;
}
//# sourceMappingURL=TrainingService.d.ts.map