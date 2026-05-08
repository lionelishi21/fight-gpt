import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IArtistOnboardingService } from '../services/ArtistOnboardingService';

export class ArtistOnboardingController extends BaseController {
    constructor(private readonly service: IArtistOnboardingService) {
        super();
    }

    // GET /api/artist/profile
    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const profile = await this.service.getOrCreateProfile(userId);
            this.sendSuccess(res, profile);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get profile');
        }
    };

    // PUT /api/artist/profile/step/:step
    saveStep = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const step = parseInt(req.params.step);
            if (isNaN(step) || step < 1 || step > 8) {
                res.status(400).json({ success: false, error: 'Invalid step (1-8)' });
                return;
            }
            const profile = await this.service.saveStep(userId, step, req.body);
            this.sendSuccess(res, profile);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to save step');
        }
    };

    // POST /api/artist/profile/submit
    submitForReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const profile = await this.service.submitForReview(userId);
            this.sendSuccess(res, profile);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to submit');
        }
    };

    // GET /api/artist/documents
    getDocuments = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const docs = await this.service.getDocuments(userId);
            this.sendSuccess(res, docs);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get documents');
        }
    };

    // POST /api/artist/documents
    uploadDocument = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const { artistProfileId, documentType } = req.body;
            const file = (req as any).file;
            if (!file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
            if (!artistProfileId || !documentType) { res.status(400).json({ success: false, error: 'artistProfileId and documentType required' }); return; }

            const storageKey = `artists/${artistProfileId}/${documentType}/${Date.now()}_${file.originalname}`;
            const doc = await this.service.saveDocument(userId, artistProfileId, documentType, {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                buffer: file.buffer,
                storageKey,
            });
            this.sendSuccess(res, doc, 201);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to upload document');
        }
    };

    // GET /api/artist/tracks
    getTracks = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const tracks = await this.service.getTracks(userId);
            this.sendSuccess(res, tracks);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to get tracks');
        }
    };

    // POST /api/artist/tracks
    submitTrack = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const track = await this.service.submitTrack(userId, req.body);
            this.sendSuccess(res, track, 201);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to submit track');
        }
    };

    // POST /api/artist/split-sheets
    saveSplitSheet = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user._id.toString();
            const sheet = await this.service.saveSplitSheet(userId, req.body);
            this.sendSuccess(res, sheet, 201);
        } catch (error) {
            this.sendError(res, error instanceof Error ? error.message : 'Failed to save split sheet');
        }
    };

    private sendSuccess(res: Response, data: any, status = 200): void {
        res.status(status).json({ success: true, data });
    }
}
