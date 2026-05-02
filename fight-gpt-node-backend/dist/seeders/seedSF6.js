"use strict";
/**
 * Street Fighter 6 Seeder
 * Seeds the database with Street Fighter 6 game and all base roster characters
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSF6 = seedSF6;
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
const Game_1 = require("../models/Game");
const Character_1 = require("../models/Character");
const logger_1 = require("../helpers/logger");
// Load environment variables
dotenv_1.default.config();
/**
 * Street Fighter 6 game data
 */
const SF6_GAME = {
    game_id: 'sf6',
    name: 'Street Fighter 6',
    full_name: 'Street Fighter 6',
    publisher: 'Capcom',
    developer: 'Capcom',
    release_date: new Date('2023-06-02'),
    genre: 'Fighting',
    platform: ['PS5', 'Xbox Series X', 'PC', 'PS4'],
    icon_url: 'https://example.com/icons/sf6.png',
    banner_url: 'https://example.com/banners/sf6.jpg',
    description: 'Street Fighter 6 is the latest entry in the legendary fighting game franchise. Featuring a new RE Engine, Drive System, and World Tour mode.',
    is_active: true,
    latest_version: '1.05',
};
/**
 * Street Fighter 6 base roster characters with basic moves
 * This is a simplified seeder - move data can be expanded later
 */
const SF6_CHARACTERS = [
    // Ryu
    {
        game_id: 'sf6',
        name: 'Ryu',
        version: '1.05',
        is_current: true,
        archetype: 'Shoto',
        difficulty: 1,
        description: 'A dedicated martial artist seeking true strength through the pursuit of the ultimate fight.',
        stats: {
            walk_speed: 4.5,
            dash_frames: 18,
            jump_speed: 5.2,
            air_dash: false,
            backdash_frames: 20,
            throw_range: 1.2,
        },
        moves: [
            {
                id: 'l_hadoken',
                name: 'Light Hadoken',
                startup: 10,
                active: 2,
                recovery: 28,
                on_block: -7,
                on_hit: 2,
                on_counter_hit: 5,
                damage: 600,
                stun: 80,
                tags: ['projectile', 'special'],
                notes: 'Projectile, travels full screen',
            },
            {
                id: 'h_hadoken',
                name: 'Heavy Hadoken',
                startup: 12,
                active: 3,
                recovery: 25,
                on_block: -5,
                on_hit: 2,
                on_counter_hit: 5,
                damage: 800,
                stun: 100,
                tags: ['projectile', 'special'],
                notes: 'Projectile, travels full screen',
            },
            {
                id: 'shoryuken',
                name: 'Shoryuken',
                startup: 4,
                active: 8,
                recovery: 25,
                on_block: -14,
                on_hit: 6,
                damage: 1000,
                stun: 150,
                tags: ['special', 'anti_air'],
                notes: 'Invincible on startup, anti-air',
            },
            {
                id: 'tatsu',
                name: 'Tatsumaki Senpukyaku',
                startup: 11,
                active: 4,
                recovery: 19,
                on_block: -5,
                on_hit: 0,
                damage: 700,
                tags: ['special'],
                notes: 'Multi-hitting kick',
            },
            {
                id: 'denjin_hadoken',
                name: 'Denjin Hadoken',
                startup: 5,
                active: 10,
                recovery: 45,
                on_block: -23,
                on_hit: 25,
                damage: 2400,
                stun: 400,
                tags: ['super'],
                notes: 'Level 3 Super Art',
            },
        ],
        patch_notes_summary: 'Base character, balanced playstyle',
    },
    // Luke
    {
        game_id: 'sf6',
        name: 'Luke',
        version: '1.05',
        is_current: true,
        archetype: 'Rushdown',
        difficulty: 1,
        description: 'A contractor for a private military company who uses his elite military background to teach mixed martial arts.',
        stats: {
            walk_speed: 4.8,
            dash_frames: 16,
            jump_speed: 5.5,
            air_dash: false,
            backdash_frames: 18,
            throw_range: 1.3,
        },
        moves: [
            {
                id: 'sandblast',
                name: 'Sand Blast',
                startup: 10,
                active: 2,
                recovery: 26,
                on_block: -6,
                on_hit: 2,
                damage: 600,
                tags: ['projectile', 'special'],
            },
            {
                id: 'rising_uppercut',
                name: 'Rising Uppercut',
                startup: 5,
                active: 10,
                recovery: 23,
                on_block: -12,
                on_hit: 4,
                damage: 900,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'flash_knuckle',
                name: 'Flash Knuckle',
                startup: 11,
                active: 6,
                recovery: 15,
                on_block: -2,
                on_hit: 4,
                damage: 800,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Aggressive rushdown character',
    },
    // Jamie
    {
        game_id: 'sf6',
        name: 'Jamie',
        version: '1.05',
        is_current: true,
        archetype: 'Rekka',
        difficulty: 2,
        description: 'A self-appointed peacekeeper of Chinatown who aspires to follow in the footsteps of Yun and Yang.',
        stats: {
            walk_speed: 5.0,
            dash_frames: 14,
            jump_speed: 5.8,
            air_dash: false,
            backdash_frames: 16,
            throw_range: 1.2,
        },
        moves: [
            {
                id: 'lush_lotus',
                name: 'Lush Lotus Strike',
                startup: 10,
                active: 4,
                recovery: 20,
                on_block: -3,
                on_hit: 2,
                damage: 700,
                tags: ['special'],
            },
            {
                id: 'arrow_kick',
                name: 'Arrow Kick',
                startup: 12,
                active: 5,
                recovery: 18,
                on_block: -4,
                on_hit: 0,
                damage: 800,
                tags: ['special', 'low'],
            },
            {
                id: 'sway',
                name: 'Sway',
                startup: 1,
                active: 31,
                recovery: 13,
                on_block: -5,
                on_hit: 0,
                damage: 0,
                tags: ['special'],
                notes: 'Evasive move',
            },
        ],
        patch_notes_summary: 'Drunken boxing style, drinks unlock moves',
    },
    // Chun-Li
    {
        game_id: 'sf6',
        name: 'Chun-Li',
        version: '1.05',
        is_current: true,
        archetype: 'Stance',
        difficulty: 2,
        description: 'A former Interpol investigator who now teaches kung fu and looks after Li-Fen.',
        stats: {
            walk_speed: 5.2,
            dash_frames: 13,
            jump_speed: 6.0,
            air_dash: false,
            backdash_frames: 15,
            throw_range: 1.1,
        },
        moves: [
            {
                id: 'kikoken',
                name: 'Kikoken',
                startup: 9,
                active: 2,
                recovery: 30,
                on_block: -8,
                on_hit: 1,
                damage: 500,
                tags: ['projectile', 'special'],
            },
            {
                id: 'spinning_bird_kick',
                name: 'Spinning Bird Kick',
                startup: 6,
                active: 12,
                recovery: 22,
                on_block: -10,
                on_hit: 2,
                damage: 900,
                tags: ['special', 'low'],
            },
            {
                id: 'hundred_lightning_kicks',
                name: 'Hundred Lightning Kicks',
                startup: 5,
                active: 8,
                recovery: 32,
                on_block: -18,
                on_hit: 8,
                damage: 1800,
                tags: ['super'],
            },
        ],
        patch_notes_summary: 'Fast mobility, strong normals',
    },
    // Guile
    {
        game_id: 'sf6',
        name: 'Guile',
        version: '1.05',
        is_current: true,
        archetype: 'Zoner',
        difficulty: 2,
        description: 'A US Air Force major who fights for his country and his family.',
        stats: {
            walk_speed: 4.0,
            dash_frames: 20,
            jump_speed: 4.8,
            air_dash: false,
            backdash_frames: 22,
            throw_range: 1.4,
        },
        moves: [
            {
                id: 'sonic_boom',
                name: 'Sonic Boom',
                startup: 10,
                active: 3,
                recovery: 35,
                on_block: -12,
                on_hit: -1,
                damage: 700,
                tags: ['projectile', 'special'],
            },
            {
                id: 'flash_kick',
                name: 'Flash Kick',
                startup: 3,
                active: 12,
                recovery: 33,
                on_block: -24,
                on_hit: -8,
                damage: 1100,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'sonic_harness',
                name: 'Sonic Harness',
                startup: 7,
                active: 4,
                recovery: 18,
                on_block: -2,
                on_hit: 4,
                damage: 600,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Zoning character, charge inputs',
    },
    // Ken
    {
        game_id: 'sf6',
        name: 'Ken',
        version: '1.05',
        is_current: true,
        archetype: 'Rushdown',
        difficulty: 1,
        description: 'A former US Martial Arts Champion who now seeks to clear his name and protect his family.',
        stats: {
            walk_speed: 4.7,
            dash_frames: 15,
            jump_speed: 5.4,
            air_dash: false,
            backdash_frames: 19,
            throw_range: 1.3,
        },
        moves: [
            {
                id: 'hadoken',
                name: 'Hadoken',
                startup: 11,
                active: 2,
                recovery: 27,
                on_block: -6,
                on_hit: 2,
                damage: 600,
                tags: ['projectile', 'special'],
            },
            {
                id: 'shoryuken',
                name: 'Shoryuken',
                startup: 4,
                active: 8,
                recovery: 25,
                on_block: -14,
                on_hit: 6,
                damage: 1000,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'tatsu',
                name: 'Jinrai Kick',
                startup: 10,
                active: 3,
                recovery: 20,
                on_block: -4,
                on_hit: 2,
                damage: 700,
                tags: ['special'],
            },
            {
                id: 'dragonlash',
                name: 'Dragonlash Kick',
                startup: 12,
                active: 4,
                recovery: 17,
                on_block: -2,
                on_hit: 4,
                damage: 800,
                tags: ['special', 'overhead'],
            },
        ],
        patch_notes_summary: 'Rushdown variant of Ryu',
    },
    // Kimberly
    {
        game_id: 'sf6',
        name: 'Kimberly',
        version: '1.05',
        is_current: true,
        archetype: 'Ninja',
        difficulty: 2,
        description: 'A spunky college graduate who wants to be a ninja and save her city.',
        stats: {
            walk_speed: 5.5,
            dash_frames: 12,
            jump_speed: 6.2,
            air_dash: false,
            backdash_frames: 14,
            throw_range: 1.2,
        },
        moves: [
            {
                id: 'bushin_senpukyaku',
                name: 'Bushin Senpukyaku',
                startup: 9,
                active: 6,
                recovery: 19,
                on_block: -5,
                on_hit: 2,
                damage: 700,
                tags: ['special'],
            },
            {
                id: 'hazanshu',
                name: 'Hazanshu',
                startup: 11,
                active: 4,
                recovery: 16,
                on_block: -3,
                on_hit: 4,
                damage: 600,
                tags: ['special', 'overhead'],
            },
            {
                id: 'smash_over',
                name: 'Smash Over',
                startup: 5,
                active: 10,
                recovery: 28,
                on_block: -16,
                on_hit: 0,
                damage: 900,
                tags: ['super'],
            },
        ],
        patch_notes_summary: 'Bushinryu ninja, high mobility',
    },
    // Juri
    {
        game_id: 'sf6',
        name: 'Juri',
        version: '1.05',
        is_current: true,
        archetype: 'Mixup',
        difficulty: 2,
        description: 'A thrill-seeker who takes pleasure in the suffering of others.',
        stats: {
            walk_speed: 4.9,
            dash_frames: 14,
            jump_speed: 5.6,
            air_dash: false,
            backdash_frames: 16,
            throw_range: 1.2,
        },
        moves: [
            {
                id: 'fuhajin',
                name: 'Fuhajin',
                startup: 8,
                active: 2,
                recovery: 25,
                on_block: -7,
                on_hit: 0,
                damage: 400,
                tags: ['projectile', 'special'],
            },
            {
                id: 'tensenrin',
                name: 'Tensenrin',
                startup: 5,
                active: 10,
                recovery: 24,
                on_block: -13,
                on_hit: 1,
                damage: 1000,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'ankokukyaku',
                name: 'Ankokukyaku',
                startup: 10,
                active: 4,
                recovery: 18,
                on_block: -4,
                on_hit: 2,
                damage: 700,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Feng Shui Engine stores charges',
    },
    // Dhalsim
    {
        game_id: 'sf6',
        name: 'Dhalsim',
        version: '1.05',
        is_current: true,
        archetype: 'Zoner',
        difficulty: 3,
        description: 'An Indian monk and yoga master who can stretch his limbs and breathe fire.',
        stats: {
            walk_speed: 3.5,
            dash_frames: 24,
            jump_speed: 4.0,
            air_dash: true,
            backdash_frames: 26,
            throw_range: 2.0,
        },
        moves: [
            {
                id: 'yoga_fire',
                name: 'Yoga Fire',
                startup: 14,
                active: 3,
                recovery: 40,
                on_block: -15,
                on_hit: -3,
                damage: 800,
                tags: ['projectile', 'special'],
            },
            {
                id: 'yoga_flame',
                name: 'Yoga Flame',
                startup: 13,
                active: 4,
                recovery: 32,
                on_block: -10,
                on_hit: 2,
                damage: 1000,
                tags: ['special'],
            },
            {
                id: 'yoga_teleport',
                name: 'Yoga Teleport',
                startup: 1,
                active: 20,
                recovery: 10,
                on_block: 0,
                on_hit: 0,
                damage: 0,
                tags: ['special'],
                notes: 'Teleport move',
            },
        ],
        patch_notes_summary: 'Long-range zoning, unique movement',
    },
    // Blanka
    {
        game_id: 'sf6',
        name: 'Blanka',
        version: '1.05',
        is_current: true,
        archetype: 'Wild',
        difficulty: 2,
        description: 'A kind-hearted man of nature who defends his jungle home.',
        stats: {
            walk_speed: 4.3,
            dash_frames: 17,
            jump_speed: 5.0,
            air_dash: false,
            backdash_frames: 19,
            throw_range: 1.3,
        },
        moves: [
            {
                id: 'rolling_attack',
                name: 'Rolling Attack',
                startup: 8,
                active: 20,
                recovery: 20,
                on_block: -12,
                on_hit: -2,
                damage: 800,
                tags: ['special'],
            },
            {
                id: 'vertical_rolling',
                name: 'Vertical Rolling',
                startup: 3,
                active: 12,
                recovery: 25,
                on_block: -18,
                on_hit: -4,
                damage: 900,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'electric_thunder',
                name: 'Electric Thunder',
                startup: 4,
                active: 8,
                recovery: 25,
                on_block: -12,
                on_hit: 4,
                damage: 700,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Wild beast character, electric attacks',
    },
    // E. Honda
    {
        game_id: 'sf6',
        name: 'E. Honda',
        version: '1.05',
        is_current: true,
        archetype: 'Power',
        difficulty: 1,
        description: 'A sumo wrestler who seeks to bring the sport to the rest of the world.',
        stats: {
            walk_speed: 4.2,
            dash_frames: 19,
            jump_speed: 4.5,
            air_dash: false,
            backdash_frames: 21,
            throw_range: 1.5,
        },
        moves: [
            {
                id: 'hundred_hand_slap',
                name: 'Hundred Hand Slap',
                startup: 6,
                active: 20,
                recovery: 22,
                on_block: -10,
                on_hit: 2,
                damage: 1000,
                tags: ['special'],
            },
            {
                id: 'sumo_headbutt',
                name: 'Sumo Headbutt',
                startup: 10,
                active: 8,
                recovery: 20,
                on_block: -8,
                on_hit: 0,
                damage: 900,
                tags: ['special'],
            },
            {
                id: 'sumo_splash',
                name: 'Sumo Splash',
                startup: 5,
                active: 10,
                recovery: 28,
                on_block: -16,
                on_hit: -4,
                damage: 1100,
                tags: ['special', 'anti_air'],
            },
        ],
        patch_notes_summary: 'Grappler with command grabs',
    },
    // Zangief
    {
        game_id: 'sf6',
        name: 'Zangief',
        version: '1.05',
        is_current: true,
        archetype: 'Grappler',
        difficulty: 2,
        description: 'A professional wrestler known as the Red Cyclone.',
        stats: {
            walk_speed: 3.8,
            dash_frames: 22,
            jump_speed: 4.2,
            air_dash: false,
            backdash_frames: 24,
            throw_range: 1.8,
        },
        moves: [
            {
                id: 'spinning_pile_driver',
                name: 'Spinning Pile Driver',
                startup: 5,
                active: 2,
                recovery: 45,
                on_block: 0,
                on_hit: 0,
                damage: 1800,
                stun: 300,
                tags: ['throw', 'special'],
                notes: 'Command grab',
            },
            {
                id: 'double_lariat',
                name: 'Double Lariat',
                startup: 4,
                active: 10,
                recovery: 32,
                on_block: -16,
                on_hit: -4,
                damage: 1000,
                tags: ['special'],
            },
            {
                id: 'banishing_flat',
                name: 'Banishing Flat',
                startup: 8,
                active: 4,
                recovery: 18,
                on_block: -4,
                on_hit: 4,
                damage: 800,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Grappler, command grabs are primary tool',
    },
    // Cammy
    {
        game_id: 'sf6',
        name: 'Cammy',
        version: '1.05',
        is_current: true,
        archetype: 'Rushdown',
        difficulty: 2,
        description: 'A member of the British special forces unit Delta Red.',
        stats: {
            walk_speed: 5.1,
            dash_frames: 13,
            jump_speed: 5.9,
            air_dash: false,
            backdash_frames: 15,
            throw_range: 1.1,
        },
        moves: [
            {
                id: 'spiral_arrow',
                name: 'Spiral Arrow',
                startup: 9,
                active: 4,
                recovery: 18,
                on_block: -5,
                on_hit: 2,
                damage: 700,
                tags: ['special', 'low'],
            },
            {
                id: 'cannon_spike',
                name: 'Cannon Spike',
                startup: 4,
                active: 8,
                recovery: 24,
                on_block: -15,
                on_hit: -2,
                damage: 900,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'hooligan_combination',
                name: 'Hooligan Combination',
                startup: 12,
                active: 4,
                recovery: 22,
                on_block: -8,
                on_hit: 0,
                damage: 600,
                tags: ['special', 'overhead'],
            },
        ],
        patch_notes_summary: 'Fast rushdown, strong mixups',
    },
    // Dee Jay
    {
        game_id: 'sf6',
        name: 'Dee Jay',
        version: '1.05',
        is_current: true,
        archetype: 'Mixup',
        difficulty: 2,
        description: 'A world-famous reggae superstar and fighter.',
        stats: {
            walk_speed: 4.6,
            dash_frames: 16,
            jump_speed: 5.3,
            air_dash: false,
            backdash_frames: 18,
            throw_range: 1.3,
        },
        moves: [
            {
                id: 'air_slasher',
                name: 'Air Slasher',
                startup: 11,
                active: 2,
                recovery: 28,
                on_block: -7,
                on_hit: 1,
                damage: 600,
                tags: ['projectile', 'special'],
            },
            {
                id: 'sobat_kick',
                name: 'Sobat Kick',
                startup: 10,
                active: 4,
                recovery: 18,
                on_block: -3,
                on_hit: 3,
                damage: 700,
                tags: ['special'],
            },
            {
                id: 'jackknife_maximum',
                name: 'Jackknife Maximum',
                startup: 5,
                active: 12,
                recovery: 32,
                on_block: -20,
                on_hit: 4,
                damage: 1600,
                tags: ['super'],
            },
        ],
        patch_notes_summary: 'Charge character, rhythmic playstyle',
    },
    // Manon
    {
        game_id: 'sf6',
        name: 'Manon',
        version: '1.05',
        is_current: true,
        archetype: 'Grappler',
        difficulty: 2,
        description: 'A supermodel and world champion judoka.',
        stats: {
            walk_speed: 4.4,
            dash_frames: 17,
            jump_speed: 5.1,
            air_dash: false,
            backdash_frames: 19,
            throw_range: 1.4,
        },
        moves: [
            {
                id: 'renverse',
                name: 'Renverse',
                startup: 6,
                active: 2,
                recovery: 42,
                on_block: 0,
                on_hit: 0,
                damage: 1200,
                stun: 200,
                tags: ['throw', 'special'],
                notes: 'Command grab, gains medals',
            },
            {
                id: 'degage',
                name: 'Dégagé',
                startup: 10,
                active: 4,
                recovery: 20,
                on_block: -5,
                on_hit: 2,
                damage: 800,
                tags: ['special'],
            },
            {
                id: 'arabesque',
                name: 'Arabesque',
                startup: 11,
                active: 5,
                recovery: 16,
                on_block: -3,
                on_hit: 4,
                damage: 700,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Grappler, gains medals from throws for damage scaling',
    },
    // Marisa
    {
        game_id: 'sf6',
        name: 'Marisa',
        version: '1.05',
        is_current: true,
        archetype: 'Power',
        difficulty: 1,
        description: 'An up-and-coming jewelry designer from Italy who claims ancestry to ancient Greek warriors.',
        stats: {
            walk_speed: 3.9,
            dash_frames: 20,
            jump_speed: 4.3,
            air_dash: false,
            backdash_frames: 22,
            throw_range: 1.6,
        },
        moves: [
            {
                id: 'gladius',
                name: 'Gladius',
                startup: 12,
                active: 4,
                recovery: 22,
                on_block: -8,
                on_hit: -2,
                damage: 1100,
                tags: ['special'],
            },
            {
                id: 'scutum',
                name: 'Scutum',
                startup: 4,
                active: 20,
                recovery: 18,
                on_block: -8,
                on_hit: -2,
                damage: 800,
                tags: ['special'],
                notes: 'Armor move',
            },
            {
                id: 'quadriga',
                name: 'Quadriga',
                startup: 14,
                active: 6,
                recovery: 26,
                on_block: -12,
                on_hit: 0,
                damage: 1300,
                tags: ['special'],
            },
        ],
        patch_notes_summary: 'Heavy hitter, armor moves, slow but powerful',
    },
    // Lily
    {
        game_id: 'sf6',
        name: 'Lily',
        version: '1.05',
        is_current: true,
        archetype: 'Grappler',
        difficulty: 2,
        description: 'A descendant of the Thunderfoot tribe who can speak with the spirits of nature.',
        stats: {
            walk_speed: 4.3,
            dash_frames: 18,
            jump_speed: 4.9,
            air_dash: false,
            backdash_frames: 20,
            throw_range: 1.3,
        },
        moves: [
            {
                id: 'wind_condor_spire',
                name: 'Wind Condor Spire',
                startup: 11,
                active: 4,
                recovery: 19,
                on_block: -4,
                on_hit: 2,
                damage: 700,
                tags: ['special'],
            },
            {
                id: 'wind_condor_axe',
                name: 'Wind Condor Axe',
                startup: 10,
                active: 6,
                recovery: 22,
                on_block: -8,
                on_hit: -2,
                damage: 900,
                tags: ['special', 'anti_air'],
            },
            {
                id: 'tomahawk_buster',
                name: 'Tomahawk Buster',
                startup: 5,
                active: 2,
                recovery: 38,
                on_block: 0,
                on_hit: 0,
                damage: 1400,
                tags: ['throw', 'special'],
                notes: 'Command grab',
            },
        ],
        patch_notes_summary: 'Charge character, uses wind stocks',
    },
    // JP
    {
        game_id: 'sf6',
        name: 'JP',
        version: '1.05',
        is_current: true,
        archetype: 'Zoner',
        difficulty: 3,
        description: 'The head of an international NGO responsible for many successful investment projects.',
        stats: {
            walk_speed: 3.6,
            dash_frames: 23,
            jump_speed: 4.1,
            air_dash: false,
            backdash_frames: 25,
            throw_range: 1.9,
        },
        moves: [
            {
                id: 'torbalan',
                name: 'Torbalan',
                startup: 13,
                active: 3,
                recovery: 38,
                on_block: -14,
                on_hit: -2,
                damage: 800,
                tags: ['projectile', 'special'],
            },
            {
                id: 'emancipation',
                name: 'Emancipation',
                startup: 12,
                active: 4,
                recovery: 28,
                on_block: -10,
                on_hit: 2,
                damage: 1000,
                tags: ['special'],
            },
            {
                id: 'crouch',
                name: 'Crouch',
                startup: 4,
                active: 28,
                recovery: 8,
                on_block: 0,
                on_hit: 0,
                damage: 0,
                tags: ['special'],
                notes: 'Stance move, can cancel into specials',
            },
        ],
        patch_notes_summary: 'Zoner with psychological warfare tools',
    },
];
/**
 * Main seeder function
 */
async function seedSF6() {
    try {
        logger_1.Logger.info('Starting Street Fighter 6 seeder...');
        // Connect to database
        await database_1.Database.connect();
        logger_1.Logger.info('Database connected');
        // Check if game already exists
        const existingGame = await Game_1.Game.findOne({ game_id: 'sf6' });
        if (existingGame) {
            logger_1.Logger.warn('Street Fighter 6 game already exists. Skipping game creation.');
        }
        else {
            // Create game
            const game = new Game_1.Game(SF6_GAME);
            await game.save();
            logger_1.Logger.info(`✅ Created game: ${game.name} (${game.game_id})`);
        }
        // Get the game to use its ID
        const game = await Game_1.Game.findOne({ game_id: 'sf6' });
        if (!game) {
            throw new Error('Failed to find or create Street Fighter 6 game');
        }
        // Check existing characters
        const existingCharacters = await Character_1.Character.find({ game_id: 'sf6', is_current: true });
        const existingNames = new Set(existingCharacters.map((c) => c.name));
        let createdCount = 0;
        let skippedCount = 0;
        // Create or update characters
        for (const characterData of SF6_CHARACTERS) {
            try {
                const character = await Character_1.Character.findOneAndUpdate({ game_id: characterData.game_id, name: characterData.name, version: characterData.version }, characterData, { upsert: true, new: true });
                logger_1.Logger.info(`✅ Seeded character: ${character.name} (${character.game_id})`);
                createdCount++;
            }
            catch (error) {
                logger_1.Logger.error(`Failed to seed character ${characterData.name}:`, error);
                throw error;
            }
        }
        // Update game character count
        const currentCharacters = await Character_1.Character.find({ game_id: 'sf6', is_current: true });
        game.supported_characters_count = currentCharacters.length;
        await game.save();
        logger_1.Logger.info(`\n✅ Seeder completed successfully!`);
        logger_1.Logger.info(`   Game: ${game.name} (${game.game_id})`);
        logger_1.Logger.info(`   Characters created: ${createdCount}`);
        logger_1.Logger.info(`   Characters skipped: ${skippedCount}`);
        logger_1.Logger.info(`   Total characters: ${currentCharacters.length}`);
        logger_1.Logger.info(`   Game character count updated: ${game.supported_characters_count}`);
    }
    catch (error) {
        logger_1.Logger.error('Seeder failed:', error);
        throw error;
    }
    finally {
        // Disconnect from database
        await database_1.Database.disconnect();
        logger_1.Logger.info('Database disconnected');
    }
}
// Run seeder if this file is executed directly
if (require.main === module) {
    seedSF6()
        .then(() => {
        logger_1.Logger.info('Seeder finished');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.Logger.error('Seeder error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seedSF6.js.map