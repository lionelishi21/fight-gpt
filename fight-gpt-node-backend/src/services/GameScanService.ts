import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppConfig } from '../config/app';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { Logger } from '../helpers/logger';

export interface ScanResult {
    patch_version: string;
    added: number;
    updated: number;
    total: number;
    errors: string[];
}

export interface DeepScanResult {
    characters_scanned: number;
    total_moves: number;
    total_combos: number;
    errors: string[];
}

interface GeminiCharacter {
    name: string;
    archetype: string;
    difficulty: number;
    description: string;
    status: 'released' | 'coming_soon';
    moves: Array<{
        name: string;
        input: string;
        damage: number;
        startup: number;
        on_block: number;
        on_hit: number;
        move_type: 'normal' | 'special' | 'super' | 'throw' | 'ex';
    }>;
}

interface GeminiScanResponse {
    patch_version: string;
    characters: GeminiCharacter[];
}

const VALID_ARCHETYPES = [
    'Rushdown', 'Zoner', 'Grappler', 'All-Rounder', 'Technical',
    'Counter-Hit', 'Evasive', 'Trickster', 'Hard-Hitter', 'Powerhouse',
];

export class GameScanService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(AppConfig.GEMINI_API_KEY);
    }

    async scanGame(gameId: string): Promise<ScanResult> {
        const result: ScanResult = { patch_version: 'unknown', added: 0, updated: 0, total: 0, errors: [] };

        const game = await Game.findOne({ game_id: gameId }).lean();
        if (!game) {
            result.errors.push(`Game not found: ${gameId}`);
            return result;
        }

        const gameName = game.full_name || game.name;
        Logger.info(`[GameScan] Starting Gemini scan for ${gameName} (${gameId})`);

        const prompt = `You are a competitive fighting game encyclopedia with accurate, up-to-date knowledge.

Return a JSON object for the fighting game "${gameName}" with this exact structure:
{
  "patch_version": "<current patch version string, e.g. '1.05'>",
  "characters": [
    {
      "name": "<official character name>",
      "archetype": "<one of: Rushdown, Zoner, Grappler, All-Rounder, Technical, Counter-Hit, Evasive, Trickster, Hard-Hitter, Powerhouse>",
      "difficulty": <integer 1-5, where 1=easiest 5=hardest>,
      "description": "<2-sentence competitive description of how this character plays>",
      "status": "<released or coming_soon>",
      "moves": [
        {
          "name": "<move name>",
          "input": "<input notation>",
          "damage": <integer>,
          "startup": <integer frames>,
          "on_block": <integer, negative means minus>,
          "on_hit": <integer, 99 = launcher/knockdown>,
          "move_type": "<normal, special, super, throw, or ex>"
        }
      ]
    }
  ]
}

Rules:
- Include the complete base roster (all released characters)
- Include characters announced as DLC/coming_soon if known
- Include 3-5 signature/essential moves per character with accurate frame data
- Archetypes must be one of the listed options only
- Difficulty must be 1-5 integer
- Return ONLY the JSON object, no markdown, no commentary`;

        let parsed: GeminiScanResponse;
        try {
            const model = this.genAI.getGenerativeModel({
                model: AppConfig.GEMINI_MODEL,
                generationConfig: { responseMimeType: 'application/json' },
            });

            const geminiResult = await model.generateContent(prompt);
            const raw = geminiResult.response.text().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            parsed = JSON.parse(raw) as GeminiScanResponse;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            Logger.error(`[GameScan] Gemini scan failed for ${gameId}:`, err);
            result.errors.push(`Gemini scan failed: ${msg}`);
            return result;
        }

        if (!parsed.characters || !Array.isArray(parsed.characters)) {
            result.errors.push('Gemini returned malformed data — no characters array');
            return result;
        }

        result.patch_version = parsed.patch_version || 'unknown';

        // Update game's patch version
        await Game.updateOne({ game_id: gameId }, { latest_version: result.patch_version });

        // Upsert each character — match on game_id + name to prevent duplication
        for (const char of parsed.characters) {
            if (!char.name?.trim()) continue;
            result.total++;

            try {
                const archetype = VALID_ARCHETYPES.includes(char.archetype) ? char.archetype : 'All-Rounder';
                const difficulty = Math.min(5, Math.max(1, Math.round(char.difficulty || 2)));

                const charDoc = {
                    game_id: gameId,
                    name: char.name.trim(),
                    version: result.patch_version,
                    is_current: char.status !== 'coming_soon',
                    archetype,
                    difficulty,
                    description: char.description || '',
                    status: char.status || 'released',
                    aliases: [char.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')],
                    moves: (char.moves || []).map(m => ({
                        name: m.name || '',
                        input: m.input || '',
                        damage: m.damage || 0,
                        startup: m.startup || 0,
                        on_block: m.on_block ?? 0,
                        on_hit: m.on_hit ?? 0,
                        move_type: m.move_type || 'normal',
                    })),
                };

                const existing = await Character.findOne({ game_id: gameId, name: char.name.trim() });
                if (existing) {
                    await Character.updateOne({ _id: existing._id }, { $set: charDoc });
                    result.updated++;
                } else {
                    await Character.create(charDoc);
                    result.added++;
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                result.errors.push(`Failed to upsert ${char.name}: ${msg}`);
            }
        }

        Logger.info(`[GameScan] ${gameId} scan complete — patch ${result.patch_version}, ${result.added} added, ${result.updated} updated`);
        return result;
    }

    /**
     * Phase 2: Deep scan — for every character in the game, call Gemini for the
     * complete moveset (all normals, specials, EX, supers) + BnB combos.
     * Writes into CharacterEncyclopedia. Safe to re-run — upserts by game_id + character_id.
     */
    async deepScanGame(gameId: string): Promise<DeepScanResult> {
        const result: DeepScanResult = { characters_scanned: 0, total_moves: 0, total_combos: 0, errors: [] };

        const game = await Game.findOne({ game_id: gameId }).lean();
        if (!game) {
            result.errors.push(`Game not found: ${gameId}`);
            return result;
        }

        const characters = await Character.find({ game_id: gameId, is_current: true }).lean();
        const gameName = game.full_name || (game as any).name;
        const patchVersion = (game as any).latest_version || 'latest';

        Logger.info(`[GameScan] Deep scan starting for ${gameName} — ${characters.length} characters`);

        const model = this.genAI.getGenerativeModel({
            model: AppConfig.GEMINI_MODEL,
            generationConfig: { responseMimeType: 'application/json' },
        });

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (let ci = 0; ci < characters.length; ci++) {
            const char = characters[ci];
            const charId = char.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            Logger.info(`[GameScan] Deep scanning ${char.name} (${ci + 1}/${characters.length})...`);

            // 2s between calls to stay within Gemini RPM quota
            if (ci > 0) await sleep(2000);

            const prompt = `You are a competitive fighting game frame data expert for ${gameName} (patch ${patchVersion}).

Return a complete JSON moveset and combo list for ${char.name}. Include every move in the game — not just highlights.

Return ONLY this JSON structure:
{
  "normals": [
    {
      "name": "<move name>",
      "input": "<input notation, e.g. 5MP or cr.MK>",
      "how_to_perform": "<plain English description>",
      "category": "normal",
      "properties": ["<e.g. cancelable, anti-air, low, overhead, projectile>"],
      "frame_data": {
        "startup": <int>,
        "active": <int>,
        "recovery": <int>,
        "on_block": <int, negative = minus>,
        "on_hit": <int>,
        "damage": <int>
      }
    }
  ],
  "specials": [ <same structure, category: "special"> ],
  "ex_moves": [ <same structure, category: "ex"> ],
  "supers": [ <same structure, category: "super"> ],
  "combos": [
    {
      "inputs": ["<move1>", "<move2>", "<move3>"],
      "damage": <int>,
      "difficulty": "<Beginner|Intermediate|Advanced>",
      "tags": ["<e.g. bnb, hitconfirm, anti-air, corner, no-meter>"],
      "description": "<what this combo is for and when to use it>"
    }
  ]
}

Rules:
- Include ALL normals (standing, crouching, jumping) with accurate frame data
- Include ALL special moves and their variants
- Include all EX/OD versions if the game has them
- Include all super/ultra/critical art moves
- Include 8-12 practical combos covering: beginner BnB, hitconfirm, anti-air, corner carry, meter dump
- Use accurate frame data from patch ${patchVersion}`;

            try {
                // Retry up to 3 times on rate limit (429) with exponential backoff
                let geminiResult: any;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        geminiResult = await model.generateContent(prompt);
                        break;
                    } catch (e: any) {
                        const is429 = e?.status === 429 || e?.message?.includes('429') || e?.message?.includes('quota');
                        if (is429 && attempt < 3) {
                            const wait = attempt * 10000; // 10s, 20s
                            Logger.warn(`[GameScan] Rate limited on ${char.name} attempt ${attempt} — retrying in ${wait / 1000}s`);
                            await sleep(wait);
                        } else throw e;
                    }
                }
                const raw = geminiResult.response.text().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                const parsed = JSON.parse(raw);

                const moveset = {
                    normals: (parsed.normals || []).map(this.normaliseMove),
                    specials: (parsed.specials || []).map(this.normaliseMove),
                    ex_moves: (parsed.ex_moves || []).map(this.normaliseMove),
                    supers: (parsed.supers || []).map(this.normaliseMove),
                };
                const combos = (parsed.combos || []).map((c: any) => ({
                    inputs: Array.isArray(c.inputs) ? c.inputs : [],
                    damage: Number(c.damage) || 0,
                    difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(c.difficulty) ? c.difficulty : 'Intermediate',
                    tags: Array.isArray(c.tags) ? c.tags : [],
                    description: c.description || '',
                }));

                await CharacterEncyclopedia.findOneAndUpdate(
                    { game_id: gameId, character_id: charId },
                    {
                        $set: {
                            game_id: gameId,
                            character_id: charId,
                            character_name: char.name,
                            patch_version: patchVersion,
                            is_current_patch: true,
                            moveset,
                            combos,
                            last_updated: new Date(),
                        },
                    },
                    { upsert: true, new: true }
                );

                const moveCount = moveset.normals.length + moveset.specials.length + moveset.ex_moves.length + moveset.supers.length;
                result.total_moves += moveCount;
                result.total_combos += combos.length;
                result.characters_scanned++;
                Logger.info(`[GameScan] ${char.name} — ${moveCount} moves, ${combos.length} combos`);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                Logger.error(`[GameScan] Deep scan failed for ${char.name}:`, err);
                result.errors.push(`${char.name}: ${msg}`);
            }
        }

        Logger.info(`[GameScan] Deep scan complete — ${result.characters_scanned} characters, ${result.total_moves} moves, ${result.total_combos} combos`);
        return result;
    }

    private normaliseMove(m: any) {
        return {
            name: m.name || '',
            input: m.input || '',
            how_to_perform: m.how_to_perform || m.input || '',
            category: m.category || 'normal',
            properties: Array.isArray(m.properties) ? m.properties : [],
            frame_data: {
                startup: Number(m.frame_data?.startup) || 0,
                active: Number(m.frame_data?.active) || 0,
                recovery: Number(m.frame_data?.recovery) || 0,
                on_block: Number(m.frame_data?.on_block) || 0,
                on_hit: Number(m.frame_data?.on_hit) || 0,
                damage: Number(m.frame_data?.damage) || 0,
            },
        };
    }
}
