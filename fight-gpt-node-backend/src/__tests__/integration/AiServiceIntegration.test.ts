import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { App } from '../../index';
import { Database } from '../../config/database';

jest.mock('@google/generative-ai', () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
            text: () => JSON.stringify({
                players: { player1: { character: 'Ryu', score: 100 }, player2: { character: 'Ken', score: 90 } },
                match_summary: 'A close match.',
                key_moments: []
            })
        }
    });

    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        }))
    };
});

jest.mock('@google/generative-ai/server', () => ({
    GoogleAIFileManager: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({
            file: { name: 'files/dummy-file', uri: 'https://generativelanguage.googleapis.com/v1beta/files/dummy-file' }
        }),
        getFile: jest.fn().mockResolvedValue({ state: 'ACTIVE' }),
        deleteFile: jest.fn().mockResolvedValue({})
    })),
    FileState: {
        PROCESSING: 'PROCESSING',
        ACTIVE: 'ACTIVE',
        FAILED: 'FAILED'
    }
}));

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

let mongoServer: MongoMemoryServer;
let app: any;

jest.setTimeout(60000);
process.env.MONGOMS_VERSION = '6.0.14';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.NODE_ENV = 'test';

    // Set dummy key for mocked google AI SDK
    process.env.GEMINI_API_KEY = 'dummy-key';

    await Database.connect();

    const application = new App();
    app = application.getApp();
});

afterAll(async () => {
    await Database.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('AI Analysis Service Integration', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should combine game rules from DB with AI analysis', async () => {
        // First, create the game metadata in DB
        await request(app)
            .post('/api/games/integration_sf6/metadata')
            .send({
                global_mechanics: [
                    {
                        key: 'Drive Impact',
                        value: 'Armor move',
                        ui_type: 'text'
                    }
                ],
                constants: {
                    team_size: 1,
                    has_air_dash: false
                },
                patch_version: '1.05',
                is_current: true
            });

        // Setup character encyclopedia for Ryu
        await request(app)
            .post('/api/games/integration_sf6/characters/ryu/encyclopedia')
            .send({
                patch_version: '1.05',
                is_current_patch: true,
                moveset: { normals: [], specials: [], ex_moves: [], supers: [] },
                game_rules: [
                    {
                        key: 'Ryu Hadoken (236P)',
                        value: 'Special fireball projectile move.',
                        ui_type: 'text'
                    }
                ]
            });

        // Second, execute the analysis route which should retrieve metadata
        const res = await request(app)
            .post('/api/analyze')
            .send({
                video_path: '/dummy/path/to/video.mp4',
                game_id: 'integration_sf6',
                p1_character_id: 'ryu',
                options: {
                    focus_areas: ['neutral', 'interactions'],
                    include_timestamps: true
                }
            });

        if (res.status !== 200) {
            console.log('Analyze response failed:', res.body);
        }

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.match_summary).toBe('A close match.');

        // Ensure the AI was actually called
        const aiInstance = new GoogleGenerativeAI('dummy-key');
        const model = aiInstance.getGenerativeModel({ model: 'gemini-1.5-flash' });

        expect(model.generateContent).toHaveBeenCalled();
        const callArgs = (model.generateContent as any).mock.calls[0][0];

        // Assert that the context injected into the prompt included our dynamically loaded DB state
        // The exact prompt generation is handled via contextHelper or similar, so we check if system_mechanics were injected
        expect(JSON.stringify(callArgs)).toContain('Drive Impact');
        expect(JSON.stringify(callArgs)).toContain('Special fireball projectile');
    });

});
