import { BaseService } from './BaseService';
import { Game } from '../models/Game';
import { Character } from '../models/Character';
import { PatchEvent } from '../models/PatchEvent';
import { GameSearchStrategy } from '../models/GameSearchStrategy';
import { IIngestionService } from './IngestionService';
import { Logger } from '../helpers/logger';
import { ApiResponse } from '../types';

export interface DeclarePatchRequest {
    version: string;
    previous_version?: string;
    changed_characters: string[];  // slugs like ['akuma', 'ken', 'cammy']
    patch_notes_url?: string;
}

export interface PatchResult {
    game_id: string;
    version: string;
    patch_event_id: string;
    game_version_updated: boolean;
    characters_archived: number;
    characters_bumped: number;
    search_strategies_created: number;
    ingestion_queued: boolean;
    errors: string[];
}

export class PatchService extends BaseService {
    constructor(private readonly ingestionService?: IIngestionService) {
        super();
    }

    /**
     * Declare a new patch for a game. This:
     * 1. Creates a PatchEvent record
     * 2. Updates Game.latest_version
     * 3. Archives (is_current=false) old character docs for changed characters
     * 4. Creates new character docs (version bump) for changed characters
     * 5. Creates high-priority post-patch search strategies
     * 6. Triggers ingestion with post-patch queries
     */
    async declarePatch(gameId: string, req: DeclarePatchRequest): Promise<ApiResponse<PatchResult>> {
        const result: PatchResult = {
            game_id: gameId,
            version: req.version,
            patch_event_id: '',
            game_version_updated: false,
            characters_archived: 0,
            characters_bumped: 0,
            search_strategies_created: 0,
            ingestion_queued: false,
            errors: [],
        };

        // 1. Get current game state
        const game = await Game.findOne({ game_id: gameId.toLowerCase() });
        if (!game) {
            return { success: false, error: `Game '${gameId}' not found` };
        }

        const previousVersion = req.previous_version || game.latest_version;

        // 2. Create PatchEvent (idempotent — skip if this version already declared)
        let patchEvent;
        try {
            patchEvent = await PatchEvent.create({
                game_id: gameId.toLowerCase(),
                version: req.version,
                previous_version: previousVersion,
                released_at: new Date(),
                patch_notes_url: req.patch_notes_url,
                changed_characters: req.changed_characters,
                status: 'pending',
            });
            result.patch_event_id = patchEvent._id.toString();
        } catch (e: any) {
            // Unique index violation means this patch was already declared
            if (e.code === 11000) {
                return { success: false, error: `Patch ${req.version} for ${gameId} was already declared` };
            }
            return { success: false, error: `PatchEvent creation failed: ${e.message}` };
        }

        // 3. Update Game.latest_version
        try {
            await Game.findOneAndUpdate(
                { game_id: gameId.toLowerCase() },
                { latest_version: req.version }
            );
            result.game_version_updated = true;
        } catch (e) {
            result.errors.push(`Failed to update game version: ${e instanceof Error ? e.message : e}`);
        }

        // 4. Archive old character docs + create versioned copies for changed characters
        for (const charSlug of req.changed_characters) {
            try {
                // Find the current character document for this slug/name
                const oldChar = await Character.findOne({
                    game_id: gameId.toLowerCase(),
                    is_current: true,
                    $or: [
                        { aliases: charSlug },
                        { name: new RegExp(`^${charSlug}$`, 'i') },
                    ],
                }).lean();

                if (!oldChar) {
                    result.errors.push(`Character '${charSlug}' not found for archival`);
                    continue;
                }

                // Mark old version as not current
                await Character.findByIdAndUpdate(oldChar._id, { is_current: false });
                result.characters_archived++;

                // Create a new doc at the new patch version
                const { _id, created_at, updated_at, version: _v, is_current: _ic, ...rest } = oldChar as any;
                await Character.create({
                    ...rest,
                    version: req.version,
                    is_current: true,
                    patch_notes_summary: `Updated in patch ${req.version}`,
                });
                result.characters_bumped++;
            } catch (e) {
                result.errors.push(`Character '${charSlug}' bump failed: ${e instanceof Error ? e.message : e}`);
            }
        }

        // 5. Create high-priority post-patch search strategies
        if (req.changed_characters.length > 0) {
            try {
                const postPatchQueries = req.changed_characters.flatMap(char => [
                    `${gameId} ${char} patch ${req.version} gameplay`,
                    `${gameId} ${char} ${req.version} combo guide`,
                ]);
                await GameSearchStrategy.create({
                    game_id: gameId.toLowerCase(),
                    queries: postPatchQueries,
                    patch_version: req.version,
                    is_active: true,
                    priority: 1,  // high priority
                });
                result.search_strategies_created = 1;
            } catch (e) {
                result.errors.push(`Search strategy creation failed: ${e instanceof Error ? e.message : e}`);
            }
        }

        // 6. Trigger ingestion for post-patch footage
        if (this.ingestionService) {
            try {
                await this.ingestionService.triggerIngestion(gameId.toLowerCase(), 15);
                result.ingestion_queued = true;
                // Update patch event status
                await PatchEvent.findByIdAndUpdate(patchEvent._id, { status: 'ingesting' });
            } catch (e) {
                result.errors.push(`Ingestion queue failed: ${e instanceof Error ? e.message : e}`);
            }
        }

        Logger.info(`[PatchService] Patch ${req.version} declared for ${gameId}: ${result.characters_bumped} chars bumped`);

        return {
            success: true,
            data: result,
            message: `Patch ${req.version} declared for ${gameId}. ${result.characters_bumped} characters updated, ingestion queued.`,
        };
    }

    /**
     * List patch history for a game
     */
    async getPatchHistory(gameId: string): Promise<ApiResponse<IPatchEvent[]>> {
        const patches = await PatchEvent.find({ game_id: gameId.toLowerCase() })
            .sort({ released_at: -1 })
            .lean();
        return { success: true, data: patches as any };
    }
}

// Re-export for convenience
import { IPatchEvent } from '../models/PatchEvent';
