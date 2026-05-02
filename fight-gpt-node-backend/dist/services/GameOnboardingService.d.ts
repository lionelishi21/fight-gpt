import { BaseService } from './BaseService';
import { IIngestionService } from './IngestionService';
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
export declare class GameOnboardingService extends BaseService {
    private readonly ingestionService?;
    constructor(ingestionService?: IIngestionService);
    /**
     * One-call game onboarding:
     * Creates Game + Characters + Encyclopedia entries + SearchStrategies
     * and queues the first ingestion run.
     *
     * Each step is independent — partial failures are recorded in errors[]
     * without rolling back successful steps.
     */
    onboardGame(req: OnboardGameRequest): Promise<ApiResponse<OnboardingResult>>;
}
//# sourceMappingURL=GameOnboardingService.d.ts.map