import { Moveset, GameRule } from '../../types/characterEncyclopedia';

export const mockRyuEncyclopedia = {
    game_id: 'sf6',
    character_id: 'ryu',
    patch_version: '1.05',
    is_current_patch: true,
    moveset: {
        normals: [],
        specials: [
            {
                name: 'Hadoken',
                input: '236P',
                how_to_perform: 'Quarter Circle Forward + Punch',
                category: 'special' as const,
                tags: ['projectile'],
                frame_data: {
                    startup: 14,
                    active: 14,
                    recovery: 32,
                    on_block: -3,
                    on_hit: 2,
                    damage: 600
                }
            }
        ],
        ex_moves: [],
        supers: [
            {
                name: 'Shinku Hadoken',
                input: '236236P',
                how_to_perform: 'Two Quarter Circles Forward + Punch',
                category: 'super' as const,
                tags: ['projectile', 'super'],
                frame_data: {
                    startup: 10,
                    active: 10,
                    recovery: 40,
                    on_block: -5,
                    on_hit: 10,
                    damage: 2000
                }
            }
        ]
    } as unknown as Moveset,
    game_rules: [
        {
            key: 'Denjin Charge',
            value: true,
            ui_type: 'state' as const,
            description: 'Powers up Ryu\'s next Hadoken or High Blade Kick.'
        }
    ] as GameRule[]
};
