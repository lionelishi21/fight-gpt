import { MongoMemoryServer } from 'mongodb-memory-server';
import { Database } from '../../config/database';
import { Character } from '../../models/Character';
import { CharacterEncyclopedia } from '../../models/CharacterEncyclopedia';
import { seedCharacterEncyclopedia } from '../../seeders/seedCharacterEncyclopedia';

let mongoServer: MongoMemoryServer;

jest.setTimeout(60000);
process.env.MONGOMS_VERSION = '6.0.14';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.NODE_ENV = 'test';

    // Connect to the DB manually
    await Database.connect();

    // Spy on connect/disconnect so the seeder doesn't close our connection
    jest.spyOn(Database, 'connect').mockResolvedValue();
    jest.spyOn(Database, 'disconnect').mockResolvedValue();
});

afterAll(async () => {
    // Restore the spy to actually close the connection
    jest.restoreAllMocks();
    await Database.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('CharacterEncyclopedia Seeder Integration', () => {

    beforeEach(async () => {
        // Clear DB
        await Character.deleteMany({});
        await CharacterEncyclopedia.deleteMany({});
    });

    it('should seed character encyclopedia from existing character data', async () => {
        // Setup initial sf6 character
        await Character.create({
            game_id: 'sf6',
            name: 'Ryu',
            is_current: true,
            version: '1.05',
            stats: {
                walk_speed: 4.7,
                jump_speed: 45
            },
            moves: [
                {
                    id: 'ryu-hadoken',
                    name: 'Hadoken',
                    startup: 14,
                    active: 14,
                    recovery: 32,
                    on_block: -3,
                    tags: ['special', 'projectile']
                },
                {
                    id: 'ryu-shinku-hadoken',
                    name: 'Shinku Hadoken',
                    startup: 10,
                    active: 10,
                    recovery: 40,
                    on_block: -5,
                    tags: ['super', 'projectile']
                }
            ]
        });

        // Run the seeder
        await seedCharacterEncyclopedia();

        // Verify the encyclopedia was created
        const encyclopedia = await CharacterEncyclopedia.findOne({ character_id: 'ryu' });
        expect(encyclopedia).toBeDefined();
        if (!encyclopedia) throw new Error('Not found');

        expect(encyclopedia.game_id).toBe('sf6');
        expect(encyclopedia.moveset.specials.length).toBe(1);
        expect(encyclopedia.moveset.specials[0].name).toBe('Hadoken');
        expect(encyclopedia.moveset.specials[0].category).toBe('special');

        expect(encyclopedia.moveset.supers.length).toBe(1);
        expect(encyclopedia.game_rules.length).toBeGreaterThan(0);
        expect(encyclopedia.game_rules.find(r => r.key === 'Drive Gauge')).toBeDefined();
    });

});
