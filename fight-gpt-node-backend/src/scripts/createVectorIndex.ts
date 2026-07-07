import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function createVectorIndex() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB Atlas.');

        const db = mongoose.connection.db;
        
        console.log('Checking if knowledgenodes collection exists...');
        const collections = await db.listCollections({ name: 'knowledgenodes' }).toArray();
        if (collections.length === 0) {
            console.log('Creating knowledgenodes collection...');
            await db.createCollection('knowledgenodes');
        }

        console.log('Creating Vector Search Index for KnowledgeNode collection...');
        
        // MongoDB Atlas createSearchIndexes command
        const result = await db.command({
            createSearchIndexes: "knowledgenodes", // The collection name (Mongoose pluralizes KnowledgeNode -> knowledgenodes)
            indexes: [
                {
                    name: "knowledge_vector_index",
                    type: "vectorSearch",
                    definition: {
                        fields: [
                            {
                                type: "vector",
                                path: "embedding",
                                numDimensions: 768, // gemini-embedding-001 output dimension
                                similarity: "cosine"
                            },
                            {
                                type: "filter",
                                path: "game_id"
                            },
                            {
                                type: "filter",
                                path: "character_id"
                            }
                        ]
                    }
                }
            ]
        });

        console.log('Vector Search Index creation initiated successfully:');
        console.log(JSON.stringify(result, null, 2));
        console.log('\nNote: It may take a few minutes for the index to finish building in the Atlas cloud.');

    } catch (error) {
        console.error('Failed to create vector index:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

createVectorIndex();
