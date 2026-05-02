import { BaseService } from './BaseService';
import { IIngestionService } from './IngestionService';
import { ApiResponse } from '../types';
export interface DeclarePatchRequest {
    version: string;
    previous_version?: string;
    changed_characters: string[];
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
export declare class PatchService extends BaseService {
    private readonly ingestionService?;
    constructor(ingestionService?: IIngestionService);
    /**
     * Declare a new patch for a game. This:
     * 1. Creates a PatchEvent record
     * 2. Updates Game.latest_version
     * 3. Archives (is_current=false) old character docs for changed characters
     * 4. Creates new character docs (version bump) for changed characters
     * 5. Creates high-priority post-patch search strategies
     * 6. Triggers ingestion with post-patch queries
     */
    declarePatch(gameId: string, req: DeclarePatchRequest): Promise<ApiResponse<PatchResult>>;
    /**
     * List patch history for a game
     */
    getPatchHistory(gameId: string): Promise<ApiResponse<IPatchEvent[]>>;
}
import { IPatchEvent } from '../models/PatchEvent';
//# sourceMappingURL=PatchService.d.ts.map