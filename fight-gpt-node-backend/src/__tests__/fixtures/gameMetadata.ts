import { GameRule } from '../../types/characterEncyclopedia';

export const mockGameMetadataSf6 = {
    game_id: 'sf6',
    game_name: 'Street Fighter 6',
    developer: 'Capcom',
    release_date: '2023-06-02',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series X/S'],
    global_mechanics: [
        {
            key: 'Drive Gauge',
            value: 6,
            ui_type: 'meter' as const,
            description: 'Used for Drive features like Parry, Rush, Impact, Reversal.'
        },
        {
            key: 'Burnout',
            value: true,
            ui_type: 'state' as const,
            description: 'State entered when Drive Gauge hits zero. Incoming attacks do chip damage.'
        }
    ],
    constants: {
        team_size: 1,
        has_air_dash: false,
        has_air_block: false
    },
    patch_version: '1.05',
    is_current: true
};

export const mockGameMetadataTekken8 = {
    game_id: 'tekken8',
    game_name: 'Tekken 8',
    developer: 'Bandai Namco',
    release_date: '2024-01-26',
    platforms: ['PC', 'PS5', 'Xbox Series X/S'],
    global_mechanics: [
        {
            key: 'Heat System',
            value: true,
            ui_type: 'state' as const,
            description: 'Aggressive mechanic allowing Heat Smashes and Heat Dashes.'
        },
        {
            key: 'Rage Art',
            value: true,
            ui_type: 'state' as const,
            description: 'Powerful attack available at low health.'
        }
    ],
    constants: {
        team_size: 1,
        has_air_dash: false,
        has_air_block: false,
        is_3d: true
    },
    patch_version: '1.02',
    is_current: true
};
