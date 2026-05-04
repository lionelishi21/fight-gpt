"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingController = void 0;
const BaseController_1 = require("./BaseController");
const TrainingService_1 = require("../services/TrainingService");
const MissionDetailService_1 = require("../services/MissionDetailService");
const CharacterEncyclopediaRepository_1 = require("../repositories/CharacterEncyclopediaRepository");
const AnalysisRepository_1 = require("../repositories/AnalysisRepository");
class TrainingController extends BaseController_1.BaseController {
    service;
    detailService;
    constructor() {
        super();
        this.service = new TrainingService_1.TrainingService();
        this.detailService = new MissionDetailService_1.MissionDetailService(new CharacterEncyclopediaRepository_1.CharacterEncyclopediaRepository(), new AnalysisRepository_1.AnalysisRepository());
    }
    /**
     * Get daily missions for user
     */
    getMissions = async (req, res) => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const missions = await this.service.getMissionsForUser(userId);
            this.sendResponse(res, {
                success: true,
                data: missions
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch missions', 500);
        }
    };
    /**
     * Get detailed training content for a mission
     */
    getMissionDetails = async (req, res) => {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { id } = req.params;
            const details = await this.detailService.getMissionDetails(id, userId);
            this.sendResponse(res, {
                success: true,
                data: details
            });
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to fetch mission details', 500);
        }
    };
    /**
     * Complete a mission manually
     */
    completeMission = async (req, res) => {
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to complete mission', 500);
        }
    };
    /**
     * Submit video proof for AI validation
     */
    submitMissionProof = async (req, res) => {
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
        }
        catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to submit mission proof', 500);
        }
    };
}
exports.TrainingController = TrainingController;
//# sourceMappingURL=TrainingController.js.map