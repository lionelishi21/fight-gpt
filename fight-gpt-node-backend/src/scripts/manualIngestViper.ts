import dotenv from 'dotenv';
import path from 'path';
import { Database } from '../config/database';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { TheoryDoc } from '../models/TheoryDocument';
import { Logger } from '../helpers/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function ingest() {
    try {
        await Database.connect();
        Logger.info("Starting manual ingestion for C.Viper...");

        // 1. Ensure SF6 Game exists
        let sf6 = await Game.findOne({ game_id: 'sf6' });
        if (!sf6) {
            sf6 = new Game({
                game_id: 'sf6',
                name: 'Street Fighter 6',
                full_name: 'Street Fighter 6',
                publisher: 'Capcom',
                developer: 'Capcom',
                is_active: true,
                latest_version: '1.05'
            });
            await sf6.save();
            Logger.info("Created SF6 game record.");
        }

        // 2. Create C.Viper Character
        const characterData = {
            game_id: 'sf6',
            name: 'C. Viper',
            version: '1.05',
            is_current: true,
            archetype: 'Technical/Gadget',
            difficulty: 3,
            description: 'A technical character who uses various gadgets hidden in her suit to overwhelm opponents with high-execution setups.',
            stats: {
                walk_speed: 4.8,
                dash_frames: 16,
                jump_speed: 6.2,
                air_dash: false,
                backdash_frames: 18,
                throw_range: 1.2
            },
            moves: [
                { id: 'thunder_knuckle', name: 'Thunder Knuckle', startup: 12, active: 4, recovery: 20, on_block: -6, on_hit: 2, damage: 800, tags: ['special'] },
                { id: 'seismic_hammer', name: 'Seismic Hammer', startup: 15, active: 2, recovery: 25, on_block: -4, on_hit: 4, damage: 700, tags: ['special', 'projectile'] },
                { id: 'burning_kick', name: 'Burning Kick', startup: 18, active: 6, recovery: 22, on_block: -2, on_hit: 4, damage: 900, tags: ['special', 'overhead'] },
                { id: 'burst_time', name: 'Burst Time', startup: 7, active: 15, recovery: 45, on_block: -20, on_hit: 30, damage: 3200, tags: ['super'] }
            ]
        };
        await Character.findOneAndUpdate({ name: 'C. Viper' }, characterData, { upsert: true, new: true });
        Logger.info("Upserted C.Viper character record.");

        // 3. Create Encyclopedia Entry
        const encyclopediaData = {
            game_id: 'sf6',
            character_id: 'c_viper',
            patch_version: '1.05',
            is_current_patch: true,
            moveset: {
                normals: [
                    { name: 'Standing MP', input: '5MP', how_to_perform: 'Press Medium Punch', category: 'normal', frame_data: { startup: 6, active: 3, recovery: 12, on_block: 2, on_hit: 5, damage: 600 } },
                    { name: 'Crouching MK', input: '2MK', how_to_perform: 'Down + Medium Kick', category: 'normal', frame_data: { startup: 7, active: 3, recovery: 15, on_block: -3, on_hit: 2, damage: 500 } }
                ],
                specials: [
                    { name: 'Thunder Knuckle', input: '214P', how_to_perform: 'Quarter Circle Back + Punch', category: 'special', frame_data: { startup: 12, active: 4, recovery: 20, on_block: -6, on_hit: 2, damage: 800 } },
                    { name: 'Seismic Hammer', input: '623P', how_to_perform: 'Forward, Down, Down-Forward + Punch', category: 'special', frame_data: { startup: 15, active: 2, recovery: 25, on_block: -4, on_hit: 4, damage: 700 } }
                ],
                ex_moves: [
                    { name: 'EX Thunder Knuckle', input: '214PP', how_to_perform: 'Quarter Circle Back + Two Punches', category: 'ex', frame_data: { startup: 10, active: 4, recovery: 18, on_block: -2, on_hit: 4, damage: 1000 } }
                ],
                supers: [
                    { name: 'Burst Time', input: '236236P', how_to_perform: 'Two Quarter Circles Forward + Punch', category: 'super', frame_data: { startup: 7, active: 15, recovery: 45, on_block: -20, on_hit: 30, damage: 3200 } }
                ]
            },
            game_rules: [
                { key: 'Gadget Charge', value: 'Active', ui_type: 'state', description: 'Viper gadgets are powered by her suit batteries.' }
            ]
        };
        await CharacterEncyclopedia.findOneAndUpdate({ character_id: 'c_viper' }, encyclopediaData, { upsert: true, new: true });
        Logger.info("Upserted C.Viper encyclopedia entry.");

        // 4. Create Theory Document
        const theoryData = {
            theory_id: 'sf6-c_viper-theory',
            game_id: 'sf6',
            character_id: 'c_viper',
            character_name: 'C. Viper',
            title: 'Meta Intelligence: C.Viper Gadget Technicality',
            summary: 'C.Viper remains a high-execution technical threat with gadget-based mixups.',
            full_theory: 'C.Viper technicality revolves around Seismo-cancels and Thunder Knuckle feints. Use Burning Kick for ambiguous cross-ups. Her gameplan is to maintain pressure via gadget mobility and high-damage punishes. At the highest level, her ability to bypass traditional neutral with Seismic Hammer makes her a unique zoner-rushdown hybrid.',
            key_strengths: ['High damage resets', 'Excellent mobility with seismo-cancels', 'Ambiguous overhead/low mixups'],
            key_weaknesses: ['High execution requirements', 'Vulnerable to fast pokes if feints are read'],
            win_conditions: ['Seismo-cancel pressure loops', 'Burst Time punish on whiff'],
            counterplay: ['Interrupt seismo startup with fast lights', 'Neutral jump burning kick approaches'],
            confidence: 'high',
            type: 'character',
            source_scenario_count: 50,
            generated_at: new Date()
        };
        await TheoryDoc.findOneAndUpdate({ character_id: 'c_viper' }, theoryData, { upsert: true, new: true });
        Logger.info("Upserted C.Viper theory document.");

        Logger.info("Manual ingestion for C.Viper completed successfully!");
        await Database.disconnect();
    } catch (error) {
        Logger.error("Manual ingestion failed", error);
        process.exit(1);
    }
}

ingest();
