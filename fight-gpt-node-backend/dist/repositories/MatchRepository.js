"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Match_1 = require("../models/Match");
class MatchRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Match_1.Match);
    }
    // Removed: protected model: Model<IMatchDocument> = Match;
    async create(data) {
        const doc = await this.model.create(data);
        return doc;
    }
    async findById(id) {
        const doc = await this.model.findById(id).exec();
        if (!doc) {
            throw new Error(`Match with id ${id} not found.`);
        }
        return doc;
    }
    async findByMatchId(matchId) {
        const doc = await this.model.findOne({ match_id: matchId }).exec();
        if (!doc) {
            throw new Error(`Match with match_id ${matchId} not found.`);
        }
        return doc;
    }
    async findByGameId(gameId, limit = 20, skip = 0) {
        return this.model.find({ game_id: gameId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
    async findByPlayer(playerName, limit = 20, skip = 0) {
        return this.model.find({
            $or: [
                { 'player1.name': playerName },
                { 'player2.name': playerName }
            ]
        })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
}
exports.MatchRepository = MatchRepository;
exports.default = MatchRepository;
//# sourceMappingURL=MatchRepository.js.map