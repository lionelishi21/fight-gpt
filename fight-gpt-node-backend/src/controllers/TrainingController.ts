import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { TrainingService } from '../services/TrainingService';

export class TrainingController extends BaseController {
    private service: TrainingService;

    constructor() {
        super();
        this.service = new TrainingService();
    }

    /**
     * Get daily missions for user
     */
    public getMissions = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const missions = await this.service.getMissionsForUser(userId);

            this.sendResponse(res, {
                success: true,
                data: missions
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch missions', 500);
        }
    };

    /**
     * Complete a mission manually
     */
    public completeMission = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { id } = req.params;

            const result = await this.service.completeMission(userId, id);

            this.sendResponse(res, {
                success: true,
                data: result,
                message: 'Mission completed!'
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to complete mission', 500);
        }
    };
}
