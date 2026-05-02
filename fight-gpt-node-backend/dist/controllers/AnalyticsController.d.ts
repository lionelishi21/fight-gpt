import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { IAnalyticsService } from '../services/AnalyticsService';
export declare class AnalyticsController extends BaseController {
    private service;
    constructor(service?: IAnalyticsService);
    recordEvent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getEventCountsByType: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMostQueriedRules: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMostQueriedCharacters: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=AnalyticsController.d.ts.map