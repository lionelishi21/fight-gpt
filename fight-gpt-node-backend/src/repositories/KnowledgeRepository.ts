import { BaseRepository } from './BaseRepository';
import { IKnowledgeNodeDocument, KnowledgeNode } from '../models/KnowledgeNode';

export interface IKnowledgeRepository {
    createKnowledge(data: Partial<IKnowledgeNodeDocument>): Promise<IKnowledgeNodeDocument>;
    findSimilarKnowledge(vector: number[], gameId: string, limit?: number, characterId?: string): Promise<IKnowledgeNodeDocument[]>;
}

export class KnowledgeRepository extends BaseRepository<IKnowledgeNodeDocument> implements IKnowledgeRepository {
    constructor() {
        super(KnowledgeNode);
    }

    public async createKnowledge(data: Partial<IKnowledgeNodeDocument>): Promise<IKnowledgeNodeDocument> {
        const doc = await this.model.create(data);
        return doc;
    }

    /**
     * Performs an Atlas Vector Search to find relevant factual knowledge
     * based on the provided embedding vector representing the search query.
     * 
     * Pre-requisite: An Atlas Vector Search index named 'knowledge_vector_index' 
     * needs to be created on the `KnowledgeNode` collection.
     */
    public async findSimilarKnowledge(vector: number[], gameId: string, limit: number = 5, characterId?: string): Promise<IKnowledgeNodeDocument[]> {
        try {
            const filter: any = { game_id: gameId };
            
            if (characterId) {
                // If a character is provided, we can look for knowledge specific to them,
                // or general knowledge (where character_id might not be set or set to some generic value, though here we strictly match)
                filter.character_id = characterId;
            }

            // Uses MongoDB Atlas `$vectorSearch` operator (Requires MongoDB v6.0.11+ / Atlas)
            return await this.model.aggregate([
                {
                    $vectorSearch: {
                        index: 'knowledge_vector_index', // Needs to match the index name created in Atlas
                        path: 'embedding',
                        queryVector: vector,
                        numCandidates: limit * 10,
                        limit: limit,
                        filter: filter
                    }
                },
                {
                    $project: {
                        embedding: 0, // Exclude the heavy vector array from results
                        score: { $meta: 'vectorSearchScore' }
                    }
                }
            ]).exec() as unknown as IKnowledgeNodeDocument[];
        } catch (error) {
            console.warn('[KnowledgeRepository] findSimilarKnowledge failed:', error instanceof Error ? error.message : error);
            return [];
        }
    }
}

export default KnowledgeRepository;
