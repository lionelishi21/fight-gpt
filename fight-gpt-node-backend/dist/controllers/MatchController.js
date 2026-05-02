"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchController = void 0;
const MatchService_1 = require("../services/MatchService");
const logger_1 = require("../helpers/logger");
class MatchController {
    service;
    constructor(service) {
        this.service = service || new MatchService_1.MatchService();
    }
    createMatch = async (req, res, next) => {
        try {
            const match = await this.service.createMatch(req.body);
            res.status(201).json({ success: true, data: match, message: 'Match created successfully' });
        }
        catch (error) {
            logger_1.Logger.error('[MatchController] Error creating match:', error);
            next(error);
        }
    };
    getMatchById = async (req, res, next) => {
        try {
            const match = await this.service.getMatchById(req.params.id);
            if (!match) {
                res.status(404).json({ success: false, error: 'Match not found' });
                return;
            }
            res.json({ success: true, data: match });
        }
        catch (error) {
            next(error);
        }
    };
    getMatchByMatchId = async (req, res, next) => {
        try {
            const match = await this.service.getMatchByMatchId(req.params.matchId);
            if (!match) {
                res.status(404).json({ success: false, error: 'Match not found' });
                return;
            }
            res.json({ success: true, data: match });
        }
        catch (error) {
            next(error);
        }
    };
    getMatchesByGameId = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const matches = await this.service.getMatchesByGameId(req.params.gameId, page, limit);
            res.json({ success: true, data: matches });
        }
        catch (error) {
            next(error);
        }
    };
    getMatchesByPlayerName = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const matches = await this.service.getMatchesByPlayerName(req.params.playerName, page, limit);
            res.json({ success: true, data: matches });
        }
        catch (error) {
            next(error);
        }
    };
    updateMatch = async (req, res, next) => {
        try {
            const match = await this.service.updateMatch(req.params.id, req.body);
            if (!match) {
                res.status(404).json({ success: false, error: 'Match not found' });
                return;
            }
            res.json({ success: true, data: match, message: 'Match updated successfully' });
        }
        catch (error) {
            next(error);
        }
    };
    deleteMatch = async (req, res, next) => {
        try {
            const deleted = await this.service.deleteMatch(req.params.id);
            if (!deleted) {
                res.status(404).json({ success: false, error: 'Match not found' });
                return;
            }
            res.json({ success: true, data: null, message: 'Match deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.MatchController = MatchController;
//# sourceMappingURL=MatchController.js.map