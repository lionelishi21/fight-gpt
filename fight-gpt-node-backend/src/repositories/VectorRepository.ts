import { BaseRepository } from './BaseRepository';
import { IScenarioDocument, Scenario } from '../models/Scenario';

export interface IVectorRepository {
    createScenario(data: Partial<IScenarioDocument>): Promise<IScenarioDocument>;
    findSimilarScenarios(vector: number[], gameId: string, limit?: number): Promise<IScenarioDocument[]>;
    addMatchReference(scenarioId: string, analysisId: string): Promise<void>;
}

export class VectorRepository extends BaseRepository<IScenarioDocument> implements IVectorRepository {
    constructor() {
        super(Scenario);
    }

    public async createScenario(data: Partial<IScenarioDocument>): Promise<IScenarioDocument> {
        const doc = await this.model.create(data);
        return doc;
    }

    /**
     * Performs an Atlas Vector Search to find similar pro-match scenarios
     * based on the provided embedding vector representing the player's mistake/state.
     * 
     * Pre-requisite: An Atlas Vector Search index needs to be created on the `Scenario` collection.
     */
    public async findSimilarScenarios(vector: number[], gameId: string, limit: number = 5): Promise<IScenarioDocument[]> {
        try {
            // Uses MongoDB Atlas `$vectorSearch` operator (Requires MongoDB v6.0.11+ / Atlas)
            return await this.model.aggregate([
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
            ]).exec() as unknown as IScenarioDocument[];
        } catch (error) {
            // Fallback for local MongoDB (non-Atlas) environments
            if (error.message?.includes('$vectorSearch') || error.code === 6047401) {
                console.warn('[VectorRepository] Atlas Vector Search is not available (likely local DB). Skipping similarity check.');
                return [];
            }
            throw error;
        }
    }

    public async addMatchReference(scenarioId: string, analysisId: string): Promise<void> {
        await this.model.updateOne(
            { scenario_id: scenarioId },
            { $addToSet: { match_references: analysisId } }
        );
    }
}

export default VectorRepository;
