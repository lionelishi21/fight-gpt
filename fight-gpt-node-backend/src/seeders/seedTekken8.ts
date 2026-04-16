/**
 * Tekken 8 Seeder
 * Seeds the database with Tekken 8 game and base roster characters
 */

import dotenv from "dotenv";
import { Database } from "../config/database";
import { Game } from "../models/Game";
import { Character } from "../models/Character";
import { Logger } from "../helpers/logger";

dotenv.config();

const TEKKEN8_GAME = {
    game_id: "tekken8",
    name: "Tekken 8",
    full_name: "Tekken 8",
    publisher: "Bandai Namco",
    developer: "Bandai Namco Studios",
    release_date: new Date("2024-01-26"),
    genre: "Fighting",
    platform: ["PS5", "Xbox Series X", "PC"],
    icon_url: "https://example.com/icons/tekken8.png",
    banner_url: "https://example.com/banners/tekken8.jpg",
    description: "Tekken 8 is the latest installment in the legendary Tekken series, featuring the new Heat system and aggressive combat philosophy.",
    is_active: true,
    supported_characters_count: 32,
    latest_version: "1.05",
};

const TEKKEN8_CHARACTERS = [
    {
        game_id: "tekken8", name: "Jin Kazama", version: "1.05", is_current: true,
        archetype: "All-Rounder", difficulty: 2,
        description: "Jin Kazama wields both Mishima Style Fighting Karate and Traditional Karate, making him the most balanced character in T8.",
        stats: { walk_speed: 4.8, dash_frames: 14, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.3 },
        moves: [
            { name: "Jab", input: "1", damage: 7, startup: 10, on_block: -1, on_hit: 8, move_type: "normal" as const },
            { name: "Demon Paw", input: "ws+2", damage: 28, startup: 16, on_block: -13, on_hit: 99, move_type: "special" as const },
            { name: "Heat Engage", input: "f+3", damage: 22, startup: 17, on_block: -3, on_hit: 10, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Kazuya Mishima", version: "1.05", is_current: true,
        archetype: "Technical", difficulty: 5,
        description: "Kazuya is the most technically demanding character in T8 — EWGF execution separates all skill levels.",
        stats: { walk_speed: 4.5, dash_frames: 16, jump_speed: 4.8, air_dash: false, backdash_frames: 19, throw_range: 1.2 },
        moves: [
            { name: "EWGF", input: "f,N,d/f+2", damage: 30, startup: 13, on_block: 12, on_hit: 99, move_type: "special" as const },
            { name: "Hellsweep", input: "f,N,d/f+4", damage: 18, startup: 20, on_block: -13, on_hit: 98, move_type: "special" as const },
            { name: "Devil Fist", input: "f+2", damage: 22, startup: 18, on_block: -9, on_hit: 5, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Paul Phoenix", version: "1.05", is_current: true,
        archetype: "Hard-Hitter", difficulty: 1,
        description: "Paul Phoenix has the highest single-hit damage in Tekken 8 with his Deathfist.",
        stats: { walk_speed: 4.3, dash_frames: 15, jump_speed: 5.0, air_dash: false, backdash_frames: 20, throw_range: 1.2 },
        moves: [
            { name: "Deathfist", input: "qcf+2", damage: 38, startup: 21, on_block: -13, on_hit: 98, move_type: "special" as const },
            { name: "Jab String", input: "1,2", damage: 16, startup: 10, on_block: -1, on_hit: 8, move_type: "normal" as const },
            { name: "Phoenix Smasher", input: "qcb+2", damage: 22, startup: 19, on_block: -14, on_hit: 5, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Nina Williams", version: "1.05", is_current: true,
        archetype: "Rushdown", difficulty: 4,
        description: "Nina Williams has the deepest throw mixup game in Tekken 8, with 11+ throw branches.",
        stats: { walk_speed: 5.0, dash_frames: 13, jump_speed: 4.9, air_dash: false, backdash_frames: 17, throw_range: 1.3 },
        moves: [
            { name: "b+1", input: "b+1", damage: 14, startup: 14, on_block: -2, on_hit: 8, move_type: "normal" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "1+3 Throw", input: "1+3", damage: 35, startup: 12, on_block: -99, on_hit: 98, move_type: "throw" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Sergei Dragunov", version: "1.05", is_current: true,
        archetype: "All-Rounder", difficulty: 3,
        description: "Dragunov has the highest consistent damage in Tekken 8 and an elite punish game.",
        stats: { walk_speed: 4.7, dash_frames: 14, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.3 },
        moves: [
            { name: "f+2", input: "f+2", damage: 18, startup: 17, on_block: -12, on_hit: 96, move_type: "normal" as const },
            { name: "b+3 Tornado", input: "b+3", damage: 24, startup: 19, on_block: -14, on_hit: 97, move_type: "special" as const },
            { name: "1,2,3", input: "1,2,3", damage: 30, startup: 10, on_block: -3, on_hit: 12, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Hwoarang", version: "1.05", is_current: true,
        archetype: "Rushdown", difficulty: 5,
        description: "Hwoarang transitions between four stances using overwhelming kick combinations.",
        stats: { walk_speed: 4.9, dash_frames: 13, jump_speed: 5.2, air_dash: false, backdash_frames: 16, throw_range: 1.1 },
        moves: [
            { name: "Flamingo b+3", input: "b+3 (Flamingo)", damage: 26, startup: 17, on_block: -12, on_hit: 99, move_type: "special" as const },
            { name: "RFF f+4,4", input: "f+4,4 (RFF)", damage: 28, startup: 18, on_block: -9, on_hit: 98, move_type: "special" as const },
            { name: "Jab to RFF", input: "1,3", damage: 18, startup: 10, on_block: -2, on_hit: 15, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Reina", version: "1.05", is_current: true,
        archetype: "Technical", difficulty: 4,
        description: "Reina combines Mishima wavedash fundamentals with unique Sentai and Raijin stances.",
        stats: { walk_speed: 4.8, dash_frames: 14, jump_speed: 5.0, air_dash: false, backdash_frames: 17, throw_range: 1.2 },
        moves: [
            { name: "Sentai 1+2", input: "1+2 (Sentai)", damage: 24, startup: 16, on_block: -6, on_hit: 12, move_type: "special" as const },
            { name: "Raijin f+1+2", input: "f+1+2 (Raijin)", damage: 20, startup: 15, on_block: -4, on_hit: 8, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "King", version: "1.05", is_current: true,
        archetype: "Grappler", difficulty: 2,
        description: "King is the premiere grappler in Tekken 8, with multi-chain throws and massive damage.",
        stats: { walk_speed: 4.4, dash_frames: 15, jump_speed: 4.8, air_dash: false, backdash_frames: 19, throw_range: 1.5 },
        moves: [
            { name: "Giant Swing", input: "qcb+1", damage: 50, startup: 12, on_block: -99, on_hit: 98, move_type: "throw" as const },
            { name: "Shining Wizard", input: "1+3 or 2+4 (chain)", damage: 55, startup: 12, on_block: -99, on_hit: 98, move_type: "throw" as const },
            { name: "d/f+2", input: "d/f+2", damage: 18, startup: 16, on_block: -12, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Jack-8", version: "1.05", is_current: true,
        archetype: "Powerhouse", difficulty: 2,
        description: "Jack-8 delivers massive wall damage with his slow but devastating power moves.",
        stats: { walk_speed: 3.8, dash_frames: 18, jump_speed: 4.5, air_dash: false, backdash_frames: 22, throw_range: 1.4 },
        moves: [
            { name: "Power Hammer", input: "d/b+2", damage: 35, startup: 20, on_block: -14, on_hit: 98, move_type: "special" as const },
            { name: "Gatling Gun", input: "d/f+1,2", damage: 22, startup: 16, on_block: -4, on_hit: 10, move_type: "normal" as const },
            { name: "d/f+2", input: "d/f+2", damage: 20, startup: 17, on_block: -14, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Steve Fox", version: "1.05", is_current: true,
        archetype: "Technical", difficulty: 4,
        description: "Steve Fox has no kicks — his entire game relies on precise punch combinations and stance mix.",
        stats: { walk_speed: 5.0, dash_frames: 12, jump_speed: 5.1, air_dash: false, backdash_frames: 16, throw_range: 1.2 },
        moves: [
            { name: "Flicker b+1", input: "b+1 (Flicker)", damage: 22, startup: 14, on_block: -4, on_hit: 12, move_type: "special" as const },
            { name: "Ducking 2", input: "2 (Ducking)", damage: 24, startup: 16, on_block: -10, on_hit: 99, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Lars Alexandersson", version: "1.05", is_current: true,
        archetype: "Rushdown", difficulty: 3,
        description: "Lars combines chain throw setups with a flexible stance for aggressive corner carry.",
        stats: { walk_speed: 4.7, dash_frames: 13, jump_speed: 5.1, air_dash: false, backdash_frames: 17, throw_range: 1.2 },
        moves: [
            { name: "Dynamic Entry", input: "f,f+3", damage: 24, startup: 19, on_block: -5, on_hit: 12, move_type: "special" as const },
            { name: "Leaping Slash", input: "b+1", damage: 16, startup: 14, on_block: -6, on_hit: 10, move_type: "normal" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Asuka Kazama", version: "1.05", is_current: true,
        archetype: "Counter-Hit", difficulty: 2,
        description: "Asuka excels at shutting down aggressive opponents with her Parry and counter tools.",
        stats: { walk_speed: 4.6, dash_frames: 15, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.2 },
        moves: [
            { name: "Parry", input: "b+1+2", damage: 0, startup: 3, on_block: 0, on_hit: 20, move_type: "special" as const },
            { name: "b+2", input: "b+2", damage: 20, startup: 16, on_block: -2, on_hit: 10, move_type: "normal" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
];

async function seedTekken8() {
    try {
        await Database.connect();
        Logger.info("Seeding Tekken 8...");

        // Upsert game
        await Game.findOneAndUpdate(
            { game_id: "tekken8" },
            TEKKEN8_GAME,
            { upsert: true, new: true }
        );
        Logger.info("Game upserted: Tekken 8");

        // Upsert characters
        let count = 0;
        for (const char of TEKKEN8_CHARACTERS) {
            await Character.findOneAndUpdate(
                { game_id: "tekken8", name: char.name },
                char,
                { upsert: true, new: true }
            );
            count++;
            Logger.info(`  Character: ${char.name}`);
        }

        Logger.info(`Tekken 8 seed complete — ${count} characters.`);
        await Database.disconnect();
        process.exit(0);
    } catch (error) {
        Logger.error("Seed failed", error);
        process.exit(1);
    }
}

seedTekken8();
