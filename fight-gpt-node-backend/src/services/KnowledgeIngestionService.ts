import { GoogleGenerativeAI } from '@google/generative-ai';
import { IKnowledgeRepository } from '../repositories/KnowledgeRepository';
import { KnowledgeType } from '../models/KnowledgeNode';
import { UuidHelper } from '../helpers/uuidHelper';

export class KnowledgeIngestionService {
    private genAI: GoogleGenerativeAI;

    constructor(
        private readonly knowledgeRepository: IKnowledgeRepository,
        private readonly geminiApiKey: string,
    ) {
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        const embedModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await embedModel.embedContent(text);
        return result.embedding.values;
    }

    /**
     * Ingest factual knowledge into the vector database.
     */
    public async ingestKnowledge(
        gameId: string,
        characterId: string | undefined,
        type: KnowledgeType,
        content: string,
        sourceUrl?: string,
        version?: string
    ) {
        try {
            console.log(`[KnowledgeIngestion] Generating embedding for ${type} data...`);
            const embedding = await this.generateEmbedding(content);

            const doc = await this.knowledgeRepository.createKnowledge({
                node_id: UuidHelper.generate(),
                game_id: gameId,
                character_id: characterId,
                type,
                content,
                source_url: sourceUrl,
                version,
                embedding,
                created_at: new Date()
            });

            console.log(`[KnowledgeIngestion] Successfully ingested ${type} data into vector database.`);
            return { success: true, data: doc };
        } catch (error) {
            console.error('[KnowledgeIngestion] Failed to ingest knowledge:', error);
            return { success: false, error: 'Failed to ingest knowledge.' };
        }
    }
}
