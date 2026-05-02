"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSearchStrategyRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const GameSearchStrategy_1 = require("../models/GameSearchStrategy");
class GameSearchStrategyRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(GameSearchStrategy_1.GameSearchStrategy);
    }
    /** Returns active strategies for a game, highest priority first. */
    async findActive(gameId) {
        return this.model
            .find({ game_id: gameId, is_active: true })
            .sort({ priority: -1, created_at: -1 })
            .lean()
            .exec();
    }
    async findByGame(gameId) {
        return this.model
            .find({ game_id: gameId })
            .sort({ priority: -1, created_at: -1 })
            .lean()
            .exec();
    }
    async create(data) {
        return this.model.create(data);
    }
    async deactivate(id) {
        await this.model.findByIdAndUpdate(id, { is_active: false });
    }
}
exports.GameSearchStrategyRepository = GameSearchStrategyRepository;
//# sourceMappingURL=GameSearchStrategyRepository.js.map