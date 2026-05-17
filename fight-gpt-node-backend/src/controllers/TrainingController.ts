import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { TrainingService } from '../services/TrainingService';
import { MissionDetailService } from '../services/MissionDetailService';
import { CharacterEncyclopediaRepository } from '../repositories/CharacterEncyclopediaRepository';
import { AnalysisRepository } from '../repositories/AnalysisRepository';

export class TrainingController extends BaseController {
    private service: TrainingService;
    private detailService: MissionDetailService;

    constructor() {
        super();
        this.service = new TrainingService();
        this.detailService = new MissionDetailService(
            new CharacterEncyclopediaRepository(),
            new AnalysisRepository()
        );
    }

    /**
     * Get daily missions for user
     */
    public getMissions = async (req: Request, res: Response): Promise<void> => {
        // Missions change daily — never serve a cached response
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.removeHeader('ETag');

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
     * Get detailed training content for a mission
     */
    public getMissionDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { id } = req.params;

            const details = await this.detailService.getMissionDetails(id, userId);

            this.sendResponse(res, {
                success: true,
                data: details
            });
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch mission details', 500);
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

    /**
     * Submit video proof for AI validation
     */
    public submitMissionProof = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { id } = req.params;
            const { proofUrl } = req.body;

            if (!proofUrl) {
                this.sendError(res, 'Proof URL is required', 400);
                return;
            }

            const result = await this.service.submitProof(userId, id, proofUrl);

            this.sendResponse(res, result);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to submit mission proof', 500);
        }
    };
}
