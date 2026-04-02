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

describe('GameMetadata API Integration', () => {
    it('should create new GameMetadata', async () => {
        const res = await request(app)
            .post('/api/games/integration_sf6/metadata')
            .send({
                global_mechanics: [
                    {
                        key: 'Drive Gauge',
                        value: 6,
                        ui_type: 'meter'
                    }
                ],
                constants: {
                    team_size: 1,
                    has_air_dash: false
                },
                patch_version: '1.05',
                is_current: true
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.game_id).toBe('integration_sf6');
    });

    it('should get current GameMetadata', async () => {
        const res = await request(app)
            .get('/api/games/integration_sf6/metadata/current');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.game_id).toBe('integration_sf6');
        expect(res.body.data.is_current).toBe(true);
    });
});
