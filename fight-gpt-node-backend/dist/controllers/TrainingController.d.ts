import { Request, Response } from 'express';
import { BaseController } from './BaseController';
export declare class TrainingController extends BaseController {
    private service;
    private detailService;
    constructor();
    /**
     * Get daily missions for user
     */
    getMissions: (req: Request, res: Response) => Promise<void>;
    /**
     * Get detailed training content for a mission
     */
    getMissionDetails: (req: Request, res: Response) => Promise<void>;
    /**
     * Complete a mission manually
     */
    completeMission: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=TrainingController.d.ts.map