import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IAdminArtistService } from '../services/AdminArtistService';
export declare class AdminArtistController extends BaseController {
    private readonly service;
    constructor(service: IAdminArtistService);
    listArtists: (req: Request, res: Response) => Promise<void>;
    getQueue: (req: Request, res: Response) => Promise<void>;
    getReviewDetail: (req: Request, res: Response) => Promise<void>;
    assignReview: (req: Request, res: Response) => Promise<void>;
    addComment: (req: Request, res: Response) => Promise<void>;
    updateChecklist: (req: Request, res: Response) => Promise<void>;
    approveArtist: (req: Request, res: Response) => Promise<void>;
    rejectArtist: (req: Request, res: Response) => Promise<void>;
    requestMoreInfo: (req: Request, res: Response) => Promise<void>;
    getPendingTracks: (req: Request, res: Response) => Promise<void>;
    approveTrack: (req: Request, res: Response) => Promise<void>;
    rejectTrack: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=AdminArtistController.d.ts.map