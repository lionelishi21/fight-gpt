import { IAnalysis } from '../models/Analysis';
/**
 * Service to handle tactical verification of practice missions.
 * Cross-references AI analysis timeline with mission goals.
 */
export declare class MissionService {
    /**
     * Verifies if an analysis fulfills the requirements of a specific mission.
     * @param analysis The completed AI analysis
     * @param userId The ID of the user who submitted proof
     */
    static verifyMissionSuccess(analysis: IAnalysis, userId: string): Promise<{
        success: boolean;
        reward_xp: number;
        skill_up?: string;
    }>;
    /**
     * Determine which skill should be upgraded based on mission text.
     */
    private static determineSkillUp;
    /**
     * Apply XP and Skill upgrades to the user document.
     */
    private static applyRewards;
}
//# sourceMappingURL=MissionService.d.ts.map