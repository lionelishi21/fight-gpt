"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const BaseController_1 = require("./BaseController");
const AnalyticsService_1 = require("../services/AnalyticsService");
const logger_1 = require("../helpers/logger");
class AnalyticsController extends BaseController_1.BaseController {
    service;
    constructor(service) {
        super();
        this.service = service || new AnalyticsService_1.AnalyticsService();
    }
    recordEvent = async (req, res, next) => {
        try {
            await this.service.recordEvent(req.body);
            this.sendResponse(res, { success: true, data: null, message: 'Event recorded' });
        }
        catch (error) {
            logger_1.Logger.error(`[AnalyticsController] Error recording event:`, error);
            next(error);
        }
    };
    getEventCountsByType = async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const counts = await this.service.getEventCountsByType(limit);
            this.sendResponse(res, { success: true, data: counts });
        }
        catch (error) {
            logger_1.Logger.error(`[AnalyticsController] Error fetching event counts:`, error);
            next(error);
        }
    };
    getMostQueriedRules = async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const gameId = req.query.gameId;
            const rules = await this.service.getMostQueriedRules(gameId, limit);
            this.sendResponse(res, { success: true, data: rules });
        }
        catch (error) {
            logger_1.Logger.error(`[AnalyticsController] Error fetching queried rules:`, error);
            next(error);
        }
    };
    getMostQueriedCharacters = async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const gameId = req.query.gameId;
            const characters = await this.service.getMostQueriedCharacters(gameId, limit);
            this.sendResponse(res, { success: true, data: characters });
        }
        catch (error) {
            logger_1.Logger.error(`[AnalyticsController] Error fetching queried characters:`, error);
            next(error);
        }
    };
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=AnalyticsController.js.map