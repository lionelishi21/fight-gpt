import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IArtistOnboardingService } from '../services/ArtistOnboardingService';
export declare class ArtistOnboardingController extends BaseController {
    private readonly service;
    constructor(service: IArtistOnboardingService);
    getProfile: (req: Request, res: Response) => Promise<void>;
    saveStep: (req: Request, res: Response) => Promise<void>;
    submitForReview: (req: Request, res: Response) => Promise<void>;
    getDocuments: (req: Request, res: Response) => Promise<void>;
    uploadDocument: (req: Request, res: Response) => Promise<void>;
    getTracks: (req: Request, res: Response) => Promise<void>;
    submitTrack: (req: Request, res: Response) => Promise<void>;
    saveSplitSheet: (req: Request, res: Response) => Promise<void>;
    private sendSuccess;
}
//# sourceMappingURL=ArtistOnboardingController.d.ts.map