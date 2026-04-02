import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { IAnalyticsService, AnalyticsService } from '../services/AnalyticsService';
import { Logger } from '../helpers/logger';

export class AnalyticsController extends BaseController {
    private service: IAnalyticsService;

    constructor(service?: IAnalyticsService) {
        super();
        this.service = service || new AnalyticsService();
    }

    public recordEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.service.recordEvent(req.body);
            this.sendResponse(res, { success: true, data: null, message: 'Event recorded' });
        } catch (error) {
            Logger.error(`[AnalyticsController] Error recording event:`, error);
            next(error);
        }
    };

    public getEventCountsByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const counts = await this.service.getEventCountsByType(limit);
            this.sendResponse(res, { success: true, data: counts });
        } catch (error) {
            Logger.error(`[AnalyticsController] Error fetching event counts:`, error);
            next(error);
        }
    };

    public getMostQueriedRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const gameId = req.query.gameId as string;
            const rules = await this.service.getMostQueriedRules(gameId, limit);
            this.sendResponse(res, { success: true, data: rules });
        } catch (error) {
            Logger.error(`[AnalyticsController] Error fetching queried rules:`, error);
            next(error);
        }
    };

    public getMostQueriedCharacters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const gameId = req.query.gameId as string;
            const characters = await this.service.getMostQueriedCharacters(gameId, limit);
            this.sendResponse(res, { success: true, data: characters });
        } catch (error) {
            Logger.error(`[AnalyticsController] Error fetching queried characters:`, error);
            next(error);
        }
    };
}
