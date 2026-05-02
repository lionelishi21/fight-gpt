import { BaseService } from './BaseService';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { CharacterEncyclopedia } from '../models/CharacterEncyclopedia';
import { GameSearchStrategy } from '../models/GameSearchStrategy';
import { IIngestionService } from './IngestionService';
import { Logger } from '../helpers/logger';
import { ApiResponse } from '../types';

export interface CharacterInput {
    name: string;
    aliases?: string[];
    archetype?: string;
    difficulty?: number;
    description?: string;
}

export interface OnboardGameRequest {
    game_id: string;
    name: string;
    full_name?: string;
    publisher?: string;
    developer?: string;
    latest_version: string;
    match_format?: '1v1' | 'team_3v3' | 'team_2v2' | 'team_tag';
    platform?: string[];
    search_queries?: string[];
    characters: CharacterInput[];
}

export interface OnboardingResult {
    game_id: string;
    game_created: boolean;
    characters_created: number;
    encyclopedia_entries_created: number;
    search_strategies_created: number;
    ingestion_queued: boolean;
    errors: string[];
}

export class GameOnboardingService extends BaseService {
    constructor(private readonly ingestionService?: IIngestionService) {
        super();
    }

    /**
     * One-call game onboarding:
     * Creates Game + Characters + Encyclopedia entries + SearchStrategies
     * and queues the first ingestion run.
     *
     * Each step is independent — partial failures are recorded in errors[]
     * without rolling back successful steps.
     */
    async onboardGame(req: OnboardGameRequest): Promise<ApiResponse<OnboardingResult>> {
        const result: OnboardingResult = {
            game_id: req.game_id,
            game_created: false,
            characters_created: 0,
            encyclopedia_entries_created: 0,
            search_strategies_created: 0,
            ingestion_queued: false,
            errors: [],
        };

        // 1. Create the Game document (idempotent — skip if exists)
        try {
            const existing = await Game.findOne({ game_id: req.game_id.toLowerCase() });
            if (existing) {
                result.errors.push(`Game '${req.game_id}' already exists — skipped game creation`);
            } else {
                await Game.create({
                    game_id: req.game_id.toLowerCase(),
                    name: req.name,
                    full_name: req.full_name || req.name,
                    publisher: req.publisher || '',
                    developer: req.developer || req.publisher || '',
                    latest_version: req.latest_version,
                    match_format: req.match_format || '1v1',
                    platform: req.platform || [],
                    is_active: true,
                    supported_characters_count: req.characters.length,
                });
                result.game_created = true;
            }
        } catch (e) {
            result.errors.push(`Game creation failed: ${e instanceof Error ? e.message : e}`);
        }

        // 2. Create Character documents + Encyclopedia entries
        for (const charInput of req.characters) {
            try {
                const slug = charInput.name.toLowerCase().replace(/\s+/g, '_');
                const existing = await Character.findOne({ game_id: req.game_id, name: charInput.name });
                if (existing) continue;

                await Character.create({
                    game_id: req.game_id.toLowerCase(),
                    name: charInput.name,
                    version: req.latest_version,
                    is_current: true,
                    archetype: charInput.archetype || 'Unknown',
                    difficulty: charInput.difficulty ?? 2,
                    description: charInput.description || '',
                    aliases: charInput.aliases ?? [slug],
                    stats: { walk_speed: 0, dash_frames: 0, jump_speed: 0, air_dash: false, backdash_frames: 0, throw_range: 0 },
                    moves: [],
                    status: 'released',
                });
                result.characters_created++;

                // Create empty encyclopedia entry
                try {
                    const charDoc = await Character.findOne({ game_id: req.game_id, name: charInput.name });
                    if (charDoc) {
                        await CharacterEncyclopedia.create({
                            game_id: req.game_id.toLowerCase(),
                            character_id: slug,
                            character_name: charInput.name,
                            patch_version: req.latest_version,
                            is_current_patch: true,
                            moveset: { normals: [], specials: [], ex_moves: [], supers: [] },
                            game_rules: [],
                            videos: [],
                        });
                        result.encyclopedia_entries_created++;
                    }
                } catch (encErr) {
                    // Non-fatal — encyclopedia can be populated later
                    Logger.warn(`[GameOnboarding] Encyclopedia creation failed for ${charInput.name}: ${encErr instanceof Error ? encErr.message : encErr}`);
                }
            } catch (charErr) {
                result.errors.push(`Character '${charInput.name}' failed: ${charErr instanceof Error ? charErr.message : charErr}`);
            }
        }

        // 3. Create search strategies if provided
        if (req.search_queries && req.search_queries.length > 0) {
            try {
                await GameSearchStrategy.create({
                    game_id: req.game_id.toLowerCase(),
                    queries: req.search_queries,
                    patch_version: req.latest_version,
                    is_active: true,
                    priority: 0,
                });
                result.search_strategies_created = 1;
            } catch (e) {
                result.errors.push(`Search strategy creation failed: ${e instanceof Error ? e.message : e}`);
            }
        }

        // 4. Queue first ingestion run
        if (this.ingestionService) {
            try {
                await this.ingestionService.triggerIngestion(req.game_id.toLowerCase(), 10);
                result.ingestion_queued = true;
            } catch (e) {
                result.errors.push(`Ingestion queue failed: ${e instanceof Error ? e.message : e}`);
            }
        }

        Logger.info(`[GameOnboarding] Completed for ${req.game_id}: ${result.characters_created} chars, ${result.encyclopedia_entries_created} encyclopedia entries`);

        return {
            success: result.errors.length === 0 || result.game_created || result.characters_created > 0,
            data: result,
            message: `Onboarding complete for ${req.game_id}. ${result.characters_created} characters created, ${result.errors.length} warnings.`,
        };
    }
}
