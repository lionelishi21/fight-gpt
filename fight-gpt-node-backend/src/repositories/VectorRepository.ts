import { BaseRepository } from './BaseRepository';
import { IScenarioDocument, Scenario } from '../models/Scenario';

export interface IVectorRepository {
    createScenario(data: Partial<IScenarioDocument>): Promise<IScenarioDocument>;
    findSimilarScenarios(vector: number[], gameId: string, limit?: number, characters?: string[]): Promise<IScenarioDocument[]>;
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
    public async findSimilarScenarios(vector: number[], gameId: string, limit: number = 5, characters?: string[]): Promise<IScenarioDocument[]> {
        try {
            const filter: any = { game_id: gameId };
            if (characters && characters.length > 0) {
                // Use $in to match scenarios involving either of the specified characters
                filter.characters_involved = { $in: characters };
            }

            // Uses MongoDB Atlas `$vectorSearch` operator (Requires MongoDB v6.0.11+ / Atlas)
            return await this.model.aggregate([
                {
                    $vectorSearch: {
                        index: 'vector_index', // Needs to match the index name created in Atlas
                        path: 'embedding',
                        queryVector: vector,
                        numCandidates: limit * 10, // Recommended 10x the limit
                        limit: limit,
                        filter: filter
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
            // Always fall back gracefully — a failed similarity check should never
            // block scenario creation. Common causes: index not yet created in Atlas,
            // local MongoDB without Atlas Search, quota exceeded, filter field not indexed.
            console.warn('[VectorRepository] findSimilarScenarios failed (treating as novel):', error instanceof Error ? error.message : error);
            return [];
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
