"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Scenario_1 = require("../models/Scenario");
class VectorRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Scenario_1.Scenario);
    }
    async createScenario(data) {
        const doc = await this.model.create(data);
        return doc;
    }
    /**
     * Performs an Atlas Vector Search to find similar pro-match scenarios
     * based on the provided embedding vector representing the player's mistake/state.
     *
     * Pre-requisite: An Atlas Vector Search index needs to be created on the `Scenario` collection.
     */
    async findSimilarScenarios(vector, gameId, limit = 5) {
        // Uses MongoDB Atlas `$vectorSearch` operator (Requires MongoDB v6.0.11+ / Atlas)
        return this.model.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index', // Needs to match the index name created in Atlas
                    path: 'embedding',
                    queryVector: vector,
                    numCandidates: limit * 10, // Recommended 10x the limit
                    limit: limit,
                    filter: {
                        game_id: gameId // Pre-filtering by game
                    }
                }
            },
            {
                $project: {
                    embedding: 0, // Exclude the heavy vector array from results
                    score: { $meta: 'vectorSearchScore' } // Include similarity score if needed
                }
            }
        ]).exec();
    }
    async addMatchReference(scenarioId, analysisId) {
        await this.model.updateOne({ scenario_id: scenarioId }, { $addToSet: { match_references: analysisId } });
    }
}
exports.VectorRepository = VectorRepository;
exports.default = VectorRepository;
//# sourceMappingURL=VectorRepository.js.map