"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitSheetRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const SplitSheet_1 = require("../models/SplitSheet");
class SplitSheetRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(SplitSheet_1.SplitSheet);
    }
    async findByArtistProfile(artistProfileId) {
        return this.model.find({ artistProfileId })
            .sort({ created_at: -1 })
            .lean().exec();
    }
    async findByTrack(trackSubmissionId) {
        return this.model.findOne({ trackSubmissionId }).lean().exec();
    }
    async findByIsrc(isrc) {
        return this.model.findOne({ isrc }).lean().exec();
    }
    async updateStatus(splitSheetId, status) {
        return this.model.findByIdAndUpdate(splitSheetId, { status }, { new: true }).lean().exec();
    }
}
exports.SplitSheetRepository = SplitSheetRepository;
//# sourceMappingURL=SplitSheetRepository.js.map