import { IAnalysis } from '../models/Analysis';
import mongoose from 'mongoose';
export declare class TrainingService {
    /**
     * Parse an analysis and generate personalized training drills (Missions)
     */
    generateDrillsFromAnalysis(analysis: IAnalysis): Promise<void>;
    private createMissionFromAI;
    private createMissionFromMistake;
    /**
     * Get all active and completed missions for a user
     */
    getMissionsForUser(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/UserMission").IUserMission, {}, {}> & import("../models/UserMission").IUserMission & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Manually complete a mission and award XP
     */
    completeMission(userId: string, userMissionId: string): Promise<mongoose.Document<unknown, {}, import("../models/UserMission").IUserMission, {}, {}> & import("../models/UserMission").IUserMission & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Submit video proof (links to a new analysis)
     */
    submitProof(userId: string, userMissionId: string, proofUrl: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
declare const _default: TrainingService;
export default _default;
//# sourceMappingURL=TrainingService.d.ts.map