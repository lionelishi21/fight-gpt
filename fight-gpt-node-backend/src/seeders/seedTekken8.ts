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
    {
        game_id: "tekken8", name: "Lili", version: "1.05", is_current: true,
        archetype: "Technical", difficulty: 3,
        description: "Lili de Rochefort combines elegant ballet-inspired movement with tricky mix-up pressure from Sudden Cross stance.",
        stats: { walk_speed: 4.9, dash_frames: 13, jump_speed: 5.3, air_dash: false, backdash_frames: 16, throw_range: 1.1 },
        moves: [
            { name: "Sudden Cross b+3", input: "b+3", damage: 22, startup: 16, on_block: -4, on_hit: 14, move_type: "special" as const },
            { name: "Divine Step 4", input: "4 (Divine Step)", damage: 28, startup: 20, on_block: -12, on_hit: 98, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Yoshimitsu", version: "1.05", is_current: true,
        archetype: "Trickster", difficulty: 5,
        description: "Yoshimitsu is the most unorthodox character in Tekken 8 — stances, sword cancels, and mind games define his playstyle.",
        stats: { walk_speed: 4.6, dash_frames: 15, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.2 },
        moves: [
            { name: "Manji Dragonfly", input: "1+2 (stance)", damage: 0, startup: 5, on_block: 0, on_hit: 0, move_type: "special" as const },
            { name: "Sword Stab", input: "d+1+2", damage: 30, startup: 22, on_block: -14, on_hit: 96, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Jun Kazama", version: "1.05", is_current: true,
        archetype: "Counter-Hit", difficulty: 3,
        description: "Jun Kazama returns with powerful Amnesia reversals and a fluid combo game anchored by her f,n,d,d/f motion.",
        stats: { walk_speed: 4.8, dash_frames: 14, jump_speed: 5.1, air_dash: false, backdash_frames: 17, throw_range: 1.2 },
        moves: [
            { name: "Amnesia", input: "b+1+2", damage: 0, startup: 3, on_block: 0, on_hit: 25, move_type: "special" as const },
            { name: "f,n,d,d/f+2", input: "f,n,d,d/f+2", damage: 28, startup: 15, on_block: 8, on_hit: 99, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Ling Xiaoyu", version: "1.05", is_current: true,
        archetype: "Evasive", difficulty: 4,
        description: "Xiaoyu's Phoenix and AOP stances give her the best evasive options in the game, making her dangerous on whiff punish.",
        stats: { walk_speed: 5.2, dash_frames: 12, jump_speed: 5.4, air_dash: false, backdash_frames: 14, throw_range: 1.0 },
        moves: [
            { name: "Phoenix f+1+2", input: "f+1+2 (Phoenix)", damage: 26, startup: 18, on_block: -6, on_hit: 14, move_type: "special" as const },
            { name: "AOP 1+2", input: "1+2 (AOP)", damage: 20, startup: 16, on_block: -4, on_hit: 10, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Marshall Law", version: "1.05", is_current: true,
        archetype: "Rushdown", difficulty: 3,
        description: "Marshall Law is the archetypal rushdown character — Dragon Sign and fast lows make him a constant offensive threat.",
        stats: { walk_speed: 4.9, dash_frames: 13, jump_speed: 5.2, air_dash: false, backdash_frames: 16, throw_range: 1.1 },
        moves: [
            { name: "Dragon Sign b+1+2", input: "b+1+2", damage: 0, startup: 5, on_block: 0, on_hit: 0, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "Junkyard Kick", input: "b+3,4", damage: 34, startup: 18, on_block: -14, on_hit: 98, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Bryan Fury", version: "1.05", is_current: true,
        archetype: "Hard-Hitter", difficulty: 2,
        description: "Bryan Fury is the strongest wall-carry character in Tekken 8. His Snake Edge low and Jet Upper define his threat.",
        stats: { walk_speed: 4.5, dash_frames: 15, jump_speed: 4.9, air_dash: false, backdash_frames: 19, throw_range: 1.3 },
        moves: [
            { name: "Jet Upper", input: "u/f+2", damage: 25, startup: 18, on_block: -14, on_hit: 99, move_type: "special" as const },
            { name: "Snake Edge", input: "d/b+3", damage: 20, startup: 21, on_block: -22, on_hit: 96, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 18, startup: 16, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Claudio Serafino", version: "1.05", is_current: true,
        archetype: "Zoner", difficulty: 2,
        description: "Claudio is the safest poking character in Tekken 8 — Starburst mode gives him massive plus frames and wall pressure.",
        stats: { walk_speed: 4.6, dash_frames: 15, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.2 },
        moves: [
            { name: "Starburst 1+2", input: "1+2 (Starburst)", damage: 30, startup: 20, on_block: -4, on_hit: 99, move_type: "special" as const },
            { name: "b+1", input: "b+1", damage: 18, startup: 14, on_block: -1, on_hit: 9, move_type: "normal" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Lee Chaolan", version: "1.05", is_current: true,
        archetype: "Technical", difficulty: 4,
        description: "Lee Chaolan demands precise just-frame inputs to unlock his Mist Step and infinite pressure sequences.",
        stats: { walk_speed: 5.0, dash_frames: 13, jump_speed: 5.1, air_dash: false, backdash_frames: 16, throw_range: 1.1 },
        moves: [
            { name: "Mist Step 3", input: "f,n+3 (Mist)", damage: 22, startup: 16, on_block: -4, on_hit: 14, move_type: "special" as const },
            { name: "Acid Storm", input: "d/b+2", damage: 20, startup: 14, on_block: -2, on_hit: 99, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Azucena", version: "1.05", is_current: true,
        archetype: "Evasive", difficulty: 3,
        description: "Azucena is a new character in Tekken 8 built around Libertador stance — unpredictable movement meets offensive mix-ups.",
        stats: { walk_speed: 5.1, dash_frames: 12, jump_speed: 5.3, air_dash: false, backdash_frames: 15, throw_range: 1.1 },
        moves: [
            { name: "Libertador b+1+2", input: "b+1+2", damage: 0, startup: 5, on_block: 0, on_hit: 0, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "LIB 1+2", input: "1+2 (LIB)", damage: 24, startup: 18, on_block: -8, on_hit: 12, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Raven", version: "1.05", is_current: true,
        archetype: "Evasive", difficulty: 3,
        description: "Raven uses teleports and shadow clones to control space — his back-turned mixups create constant fear.",
        stats: { walk_speed: 4.8, dash_frames: 13, jump_speed: 5.1, air_dash: false, backdash_frames: 17, throw_range: 1.2 },
        moves: [
            { name: "Teleport", input: "b,b+1+2", damage: 0, startup: 1, on_block: 0, on_hit: 0, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "BT d+3", input: "d+3 (BT)", damage: 22, startup: 20, on_block: -14, on_hit: 97, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Leo Kliesen", version: "1.05", is_current: true,
        archetype: "All-Rounder", difficulty: 2,
        description: "Leo is a well-rounded character with strong mids, a powerful wall game, and consistent damage routes.",
        stats: { walk_speed: 4.7, dash_frames: 14, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.2 },
        moves: [
            { name: "b+1,2", input: "b+1,2", damage: 28, startup: 14, on_block: -3, on_hit: 12, move_type: "normal" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "KNK f+1", input: "f+1 (KNK)", damage: 20, startup: 16, on_block: -5, on_hit: 10, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Alisa Bosconovitch", version: "1.05", is_current: true,
        archetype: "Zoner", difficulty: 3,
        description: "Alisa uses chainsaw attachments and rocket-boot pressure to control space at mid-to-long range.",
        stats: { walk_speed: 4.6, dash_frames: 14, jump_speed: 5.2, air_dash: false, backdash_frames: 17, throw_range: 1.1 },
        moves: [
            { name: "Chainsaw 1", input: "1 (Chainsaw)", damage: 24, startup: 17, on_block: -6, on_hit: 12, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "Boot f+4", input: "f+4", damage: 22, startup: 18, on_block: -8, on_hit: 14, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Leroy Smith", version: "1.05", is_current: true,
        archetype: "Counter-Hit", difficulty: 2,
        description: "Leroy Smith uses Wing Chun to stuff aggressive opponents — his parries and cane pokes punish rushdown hard.",
        stats: { walk_speed: 4.5, dash_frames: 15, jump_speed: 4.9, air_dash: false, backdash_frames: 19, throw_range: 1.3 },
        moves: [
            { name: "Cane d/f+1", input: "d/f+1", damage: 15, startup: 13, on_block: 0, on_hit: 8, move_type: "normal" as const },
            { name: "Parry 1+2", input: "1+2", damage: 0, startup: 3, on_block: 0, on_hit: 20, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 16, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Zafina", version: "1.05", is_current: true,
        archetype: "Trickster", difficulty: 4,
        description: "Zafina's three stances — Tarantula, Mantis, and Scarecrow — create the most unique evasion toolkit in T8.",
        stats: { walk_speed: 4.7, dash_frames: 14, jump_speed: 5.1, air_dash: false, backdash_frames: 17, throw_range: 1.1 },
        moves: [
            { name: "Tarantula 3", input: "3 (TRT)", damage: 22, startup: 17, on_block: -5, on_hit: 12, move_type: "special" as const },
            { name: "Mantis 1+2", input: "1+2 (MNT)", damage: 26, startup: 19, on_block: -8, on_hit: 99, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Devil Jin", version: "1.05", is_current: true,
        archetype: "Technical", difficulty: 5,
        description: "Devil Jin combines Mishima fundamentals with flight mode and laser attacks — the highest skill ceiling in Tekken 8.",
        stats: { walk_speed: 4.7, dash_frames: 15, jump_speed: 5.0, air_dash: true, backdash_frames: 18, throw_range: 1.2 },
        moves: [
            { name: "EWGF", input: "f,N,d/f+2", damage: 32, startup: 13, on_block: 12, on_hit: 99, move_type: "special" as const },
            { name: "Laser Cannon", input: "3+4", damage: 20, startup: 24, on_block: -4, on_hit: 10, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Eddy Gordo", version: "1.05", is_current: true,
        archetype: "Evasive", difficulty: 2,
        description: "Eddy Gordo's Capoeira allows him to attack from Ginga (swaying) stance, making his lows and mids hard to react to.",
        stats: { walk_speed: 5.0, dash_frames: 13, jump_speed: 5.3, air_dash: false, backdash_frames: 15, throw_range: 1.1 },
        moves: [
            { name: "Ginga 3", input: "3 (GNG)", damage: 24, startup: 18, on_block: -6, on_hit: 14, move_type: "special" as const },
            { name: "Cartwheel", input: "b+3", damage: 20, startup: 16, on_block: -4, on_hit: 12, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 14, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Victor Chevalier", version: "1.05", is_current: true,
        archetype: "Rushdown", difficulty: 3,
        description: "Victor Chevalier is a new character who uses a sword and pistol to control all ranges with style.",
        stats: { walk_speed: 4.8, dash_frames: 14, jump_speed: 5.0, air_dash: false, backdash_frames: 17, throw_range: 1.2 },
        moves: [
            { name: "Sword Slash f+2", input: "f+2", damage: 20, startup: 16, on_block: -4, on_hit: 10, move_type: "normal" as const },
            { name: "Pistol Shot", input: "d/f+1+2", damage: 18, startup: 20, on_block: -2, on_hit: 12, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Shaheen", version: "1.05", is_current: true,
        archetype: "All-Rounder", difficulty: 2,
        description: "Shaheen is a clean, fundamental character with great punishes, reliable mids, and strong wall pressure.",
        stats: { walk_speed: 4.7, dash_frames: 14, jump_speed: 5.0, air_dash: false, backdash_frames: 18, throw_range: 1.2 },
        moves: [
            { name: "d/f+2", input: "d/f+2", damage: 16, startup: 15, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "b+3", input: "b+3", damage: 22, startup: 17, on_block: -5, on_hit: 14, move_type: "normal" as const },
            { name: "f+1+2", input: "f+1+2", damage: 24, startup: 19, on_block: -8, on_hit: 99, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Feng Wei", version: "1.05", is_current: true,
        archetype: "All-Rounder", difficulty: 2,
        description: "Feng Wei is a high-damage brawler whose evasive b+3+4 shoulder makes him hard to challenge at mid-range.",
        stats: { walk_speed: 4.6, dash_frames: 15, jump_speed: 4.9, air_dash: false, backdash_frames: 18, throw_range: 1.3 },
        moves: [
            { name: "Evasive Shoulder b+3+4", input: "b+3+4", damage: 0, startup: 6, on_block: 0, on_hit: 0, move_type: "special" as const },
            { name: "d/f+2", input: "d/f+2", damage: 18, startup: 16, on_block: -13, on_hit: 99, move_type: "normal" as const },
            { name: "f+1+2", input: "f+1+2", damage: 26, startup: 18, on_block: -6, on_hit: 12, move_type: "special" as const },
        ],
    },
    {
        game_id: "tekken8", name: "Panda", version: "1.05", is_current: true,
        archetype: "Grappler", difficulty: 2,
        description: "Panda shares Kuma's moveset but with distinct personality — a powerful grappler with deceptive reach and massive throw damage.",
        stats: { walk_speed: 3.9, dash_frames: 17, jump_speed: 4.6, air_dash: false, backdash_frames: 21, throw_range: 1.6 },
        moves: [
            { name: "Bear Tackle", input: "qcf+1+2", damage: 45, startup: 12, on_block: -99, on_hit: 98, move_type: "throw" as const },
            { name: "d/f+2", input: "d/f+2", damage: 20, startup: 18, on_block: -14, on_hit: 99, move_type: "normal" as const },
            { name: "b+1+2", input: "b+1+2", damage: 28, startup: 20, on_block: -10, on_hit: 12, move_type: "special" as const },
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
