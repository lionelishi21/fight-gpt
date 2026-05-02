"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheoryRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const TheoryDocument_1 = require("../models/TheoryDocument");
class TheoryRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(TheoryDocument_1.TheoryDoc);
    }
    async upsertCharacterTheory(data) {
        // Mark previous theories for this character AND skill level as not current
        await this.model.updateMany({ game_id: data.game_id, character_id: data.character_id, target_skill_level: data.target_skill_level, type: 'character' }, { $set: { is_current_patch: false } }).exec();
        return this.model.findOneAndUpdate({ game_id: data.game_id, character_id: data.character_id, target_skill_level: data.target_skill_level, type: 'character', patch_version: data.patch_version }, { $set: { ...data, is_current_patch: true } }, { upsert: true, new: true }).exec();
    }
    async upsertMatchupTheory(data) {
        const [charA, charB] = [data.character_a, data.character_b].sort();
        // Mark previous theories for this matchup AND skill level as not current
        await this.model.updateMany({ game_id: data.game_id, character_a: charA, character_b: charB, target_skill_level: data.target_skill_level, type: 'matchup' }, { $set: { is_current_patch: false } }).exec();
        return this.model.findOneAndUpdate({ game_id: data.game_id, character_a: charA, character_b: charB, target_skill_level: data.target_skill_level, type: 'matchup', patch_version: data.patch_version }, { $set: { ...data, character_a: charA, character_b: charB, is_current_patch: true } }, { upsert: true, new: true }).exec();
    }
    async getCharacterTheory(gameId, characterId, skillLevel) {
        const filter = { game_id: gameId, character_id: characterId, type: 'character' };
        if (skillLevel)
            filter.target_skill_level = skillLevel;
        return this.model.findOne({ ...filter, is_current_patch: true }).exec()
            ?? this.model.findOne(filter).sort({ generated_at: -1 }).exec();
    }
    async getMatchupTheory(gameId, charA, charB, skillLevel) {
        const [a, b] = [charA, charB].sort();
        const filter = { game_id: gameId, character_a: a, character_b: b, type: 'matchup' };
        if (skillLevel)
            filter.target_skill_level = skillLevel;
        return this.model.findOne({ ...filter, is_current_patch: true }).exec()
            ?? this.model.findOne(filter).sort({ generated_at: -1 }).exec();
    }
    async getAllCharacterTheories(gameId) {
        return this.model.find({ game_id: gameId, type: 'character' }).sort({ generated_at: -1 }).exec();
    }
    async getAllMatchupTheories(gameId) {
        return this.model.find({ game_id: gameId, type: 'matchup' }).sort({ generated_at: -1 }).exec();
    }
}
exports.TheoryRepository = TheoryRepository;
//# sourceMappingURL=TheoryRepository.js.map