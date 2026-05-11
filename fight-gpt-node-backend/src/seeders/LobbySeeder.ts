import Lobby from '../models/Lobby';
import { Logger } from '../helpers/logger';

export class LobbySeeder {
    public static async seedDefaultLobbies(): Promise<void> {
        const defaults = [
            { game_id: 'GLOBAL', name: 'GLOBAL_DOJO', description: 'General combat discussion for all operators.' },
            { game_id: 'sf6', name: 'SF6_OPERATIONS', description: 'Street Fighter 6 tactical intel and punish data.' },
            { game_id: 'tekken8', name: 'TEKKEN8_LAB', description: 'Tekken 8 frame data and matchup theory.' },
            { game_id: 'ggst', name: 'GUILTY_GEAR_HUB', description: 'GGST setup sharing and system mechanics.' },
            { game_id: 'mk1', name: 'MK1_KRYPT', description: 'Mortal Kombat 1 combo routes and tech.' },
        ];

        for (const lobby of defaults) {
            const exists = await Lobby.findOne({ game_id: lobby.game_id });
            if (!exists) {
                await Lobby.create(lobby);
                Logger.info(`SEEDER: Created ${lobby.name}`);
            }
        }
    }
}
