import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { App } from '../../index';
import { Database } from '../../config/database';

let mongoServer: MongoMemoryServer;
let app: any;

jest.setTimeout(60000);
process.env.MONGOMS_VERSION = '6.0.14';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.NODE_ENV = 'test';

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

describe('CharacterEncyclopedia API Integration', () => {
    // We need some initial game metadata first before we can add character encyclopedia data,
    // though the controller actually doesn't strictly enforce foreign key to GameMetadata in MongoDB, 
    // it's cleaner to test the specific encyclopedia endpoints independently.

    it('should create new CharacterEncyclopedia', async () => {
        const res = await request(app)
            .post('/api/games/integration_sf6/characters/ryu/encyclopedia')
            .send({
                patch_version: '1.05',
                is_current_patch: true,
                moveset: {
                    normals: [],
                    specials: [
                        {
                            name: 'Hadoken',
                            input: '236P',
                            how_to_perform: 'Quarter Circle Forward + Punch',
                            type: 'special',
                            category: 'special',
                            frame_data: {
                                startup: 14,
                                active: 14,
                                recovery: 32,
                                on_block: -3,
                                on_hit: 2,
                                damage: 600,
                                stun: 100,
                                meter_gain: 25
                            },
                            tags: ['projectile']
                        }
                    ],
                    ex_moves: [],
                    supers: []
                },
                game_rules: [
                    {
                        key: 'Hadoken (236P)',
                        value: 'A standard special move. Startup: 14',
                        ui_type: 'text'
                    }
                ]
            });

        if (res.status !== 201) console.log(res.body);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.game_id).toBe('integration_sf6');
        expect(res.body.data.character_id).toBe('ryu');
        expect(res.body.data.moveset.specials[0].name).toBe('Hadoken');
    });

    it('should get current CharacterEncyclopedia', async () => {
        const res = await request(app)
            .get('/api/games/integration_sf6/characters/ryu/encyclopedia/current');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.game_id).toBe('integration_sf6');
        expect(res.body.data.character_id).toBe('ryu');
        expect(res.body.data.is_current_patch).toBe(true);
    });

    it('should get character game rules (simplified interface format)', async () => {
        const res = await request(app)
            .get('/api/games/integration_sf6/characters/ryu/encyclopedia/rules');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);

        // Find the rule that corresponds to Hadoken
        const hadokenRule = res.body.data.find((rule: any) => rule.key === 'Hadoken (236P)');
        expect(hadokenRule).toBeDefined();
        expect(hadokenRule.value).toContain('special');
        expect(hadokenRule.value).toContain('Startup: 14');
        expect(hadokenRule.ui_type).toBe('text'); // Ensure it inherits the default or mapped ui_type
    });
});
