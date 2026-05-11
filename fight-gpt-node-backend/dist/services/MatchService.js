"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const MatchRepository_1 = require("../repositories/MatchRepository");
const BaseService_1 = require("./BaseService");
const uuid_1 = require("uuid");
class MatchService extends BaseService_1.BaseService {
    repository;
    constructor(repository) {
        super();
        this.repository = repository || new MatchRepository_1.MatchRepository();
    }
    async createMatch(request) {
        this.validateMatchRequest(request);
        const matchId = request.match_id || `match_${(0, uuid_1.v4)()}`;
        return this.repository.create({ ...request, match_id: matchId });
    }
    async getMatchById(id) {
        try {
            return await this.repository.findById(id);
        }
        catch {
            return null;
        }
    }
    async getMatchByMatchId(matchId) {
        try {
            return await this.repository.findByMatchId(matchId);
        }
        catch {
            return null;
        }
    }
    async getMatchesByGameId(gameId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return this.repository.findByGameId(gameId, limit, skip);
    }
    async getMatchesByPlayerName(playerName, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return this.repository.findByPlayer(playerName, limit, skip);
    }
    async updateMatch(id, request) {
        return this.repository.update(id, request);
    }
    async deleteMatch(id) {
        return this.repository.delete(id);
    }
    async scoutMatches(gameId, characterId, limit = 10) {
        const query = { is_pro: true };
        if (gameId)
            query.game_id = gameId;
        if (characterId) {
            query.$or = [
                { 'player1.team': characterId },
                { 'player2.team': characterId }
            ];
        }
        return this.repository.find(query, limit);
    }
    validateMatchRequest(request) {
        if (!request.game_id)
            throw new Error('game_id is required');
        if (!request.format)
            throw new Error('format is required');
        if (!request.player1)
            throw new Error('player1 is required');
        if (!request.player2)
            throw new Error('player2 is required');
        const formatSizes = { '1v1': 1, '2v2': 2, '3v3': 3 };
        const maxSize = formatSizes[request.format];
        if (!maxSize)
            throw new Error(`Invalid format: ${request.format}`);
        if (request.player1.team.length > maxSize)
            throw new Error(`player1 team exceeds size for ${request.format}`);
        if (request.player2.team.length > maxSize)
            throw new Error(`player2 team exceeds size for ${request.format}`);
    }
}
exports.MatchService = MatchService;
//# sourceMappingURL=MatchService.js.map