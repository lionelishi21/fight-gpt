"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RivalRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Rival_1 = require("../models/Rival");
class RivalRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Rival_1.Rival);
    }
    async createRival(data) {
        return this.model.create(data);
    }
    async getRivalsByUserId(userId) {
        return this.model.find({ userId }).exec();
    }
    async findByTargetName(targetName, gameId) {
        return this.model.find({
            targetName: { $regex: new RegExp(`^${targetName}$`, 'i') },
            gameId
        }).exec();
    }
}
exports.RivalRepository = RivalRepository;
exports.default = RivalRepository;
//# sourceMappingURL=RivalRepository.js.map