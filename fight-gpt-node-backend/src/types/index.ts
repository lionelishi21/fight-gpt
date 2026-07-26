/**
 * Base response structure for all API responses
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
}

/**
 * Team composition for 3v3 and tag team games (e.g. DBFZ)
 */
export interface TeamComposition {
  point:   string; // point/anchor character name
  assist1: string; // second character name
  assist2: string; // third character name
}

/**
 * Analysis request payload
 */
export interface AnalysisRequest {
  youtube_url?: string;
  video_path?: string;
  game_id?: string;
  match_format?: '1v1' | 'team_3v3' | 'team_2v2' | 'team_tag';
  p1_character_id?: string;
  p2_character_id?: string;
  p1_name?: string;
  p2_name?: string;
  // Team-game fields (used when match_format is team_*)
  p1_team?: TeamComposition;
  p2_team?: TeamComposition;
  game_metadata?: {
    global_mechanics?: unknown[];
    constants?: Record<string, unknown>;
  };
  character_game_rules?: {
    p1?: unknown[];
    p2?: unknown[];
  };
  game_context_text?: string; // Formatted human-readable game context for AI prompts (legacy)
  ai_context?: string; // Enhanced "Cheat Sheet" format with movesets (new Sensei Logic format)
  pro_player_id?: string; // Link to professional player for regional/pro scouting
  video_title?: string; // Original YouTube/Video title for better AI context
  metadata?: Record<string, any>; // Flexible metadata storage
  force?: boolean; // Force re-analysis and bypass cache
  analysis_id?: string; // Original analysis ID for overwriting on reprocess
  userId?: string; // Consumer who uploaded this video — used to personalize retrieval via PlayerTendencyProfile
  analysis_type?: 'video' | 'meta_query' | 'encyclopedia_lookup'; // Type of analysis request
}

/**
 * Token usage for a single Gemini call within the analysis pipeline
 * (used to compute real AI cost instead of relying on flat per-stage estimates).
 */
export interface AiUsageRecord {
  stage: 'screen' | 'flash' | 'pro' | 'bedrock' | 'grok';
  model: string;
  prompt_tokens: number;
  candidates_tokens: number;
  total_tokens: number;
}

/**
 * Analysis response from AI service
 */
export interface AnalysisResponse {
  status: string;
  source: string;
  video_source?: string;
  game_title?: string;
  match_format?: '1v1' | 'team_3v3' | 'team_2v2' | 'team_tag';
  p1_character?: string;
  p2_character?: string;
  p1_name?: string;
  p2_name?: string;
  p1_team?: TeamComposition;
  p2_team?: TeamComposition;
  match_winner?: string;
  // Two-way character-focused analysis
  raw_events?: TimelineEvent[]; // Objective timeline extracted from video
  analysis_p1?: {
    top_3_tips: string[];
    daily_mission?: DailyMission;
    coaching_by_event: Record<string, { description: string; coach_advice: string }>; // Keyed by event timestamp or node_id
  };
  analysis_p2?: {
    top_3_tips: string[];
    daily_mission?: DailyMission;
    coaching_by_event: Record<string, { description: string; coach_advice: string }>; // Keyed by event timestamp or node_id
  };
  
  // Legacy single-perspective fields (kept for backwards compatibility)
  timeline?: TimelineEvent[];
  top_3_tips?: string[];
  daily_mission?: DailyMission;
  // Team-specific analysis block (populated when match_format is team_*)
  team_analysis?: {
    assist_synergies:        string[];
    point_character_report:  string;
    extension_routes:        string[];
    team_vortex:             TimelineEvent[];
  };
  cached?: boolean;
  analysis_id?: string;
  // Real Gemini token usage captured per pipeline stage — populated by AiService
  // so cost can be computed from actuals rather than flat per-stage estimates.
  ai_usage?: { records: AiUsageRecord[]; total_tokens: number };
}

/**
 * Timeline event in analysis — v2 schema with outcome and spacing precision
 */
export interface TimelineEvent {
  node_id?: string;
  parent_node_id?: string | null;
  timestamp: string;
  event_type:
    | 'punish_missed' | 'bad_habit' | 'pro_move' | 'neutral_loss' | 'neutral_win'
    | 'frame_trap' | 'whiff_punish' | 'okizeme' | 'corner_carry' | 'wake_up_option'
    | 'anti_air' | 'evasion' | 'spacing_error' | 'counter_hit' | 'trade'
    | 'combined_sequence';
  actor?: 'p1' | 'p2';
  move_used?: string;
  move_confidence?: 'high' | 'medium' | 'low';
  // What actually happened when the move made (or failed to make) contact
  move_outcome?: 'whiff' | 'blocked' | 'normal_hit' | 'counter_hit' | 'punish' | 'trade';
  // What the opponent was doing at the time
  opponent_response?:
    | 'standing' | 'crouching' | 'airborne' | 'backdash'
    | 'parry' | 'perfect_parry' | 'drive_reversal' | 'whiffed_attack';
  // Distance category between players
  spacing?: 'throw_range' | 'close' | 'mid_range' | 'max_range' | 'out_of_range';
  // Anti-air detection
  is_anti_air?: boolean;
  attack_direction?: 'upward_normal' | 'dp_motion' | 'charged_move' | 'super_art';
  // Evasion detection — how the opponent avoided the move
  evasion_type?:
    | 'jump_back' | 'jump_forward' | 'neutral_jump'
    | 'parry' | 'perfect_parry' | 'backdash' | 'drive_impact_armor' | null;
  description?: string; // Made optional since it might move to perspective analysis
  coach_advice?: string; // Made optional since it might move to perspective analysis
  // Combined sequences fields
  sequence_chain?: string[];
  tactical_intent?: string;
  // Legacy fields — kept for existing processVectorIntelligence callers
  turn_owner?: 'p1' | 'p2' | 'neutral' | 'contested';
  neutral_state?: 'neutral' | 'p1_offense' | 'p2_offense' | 'scramble';
  frame_advantage?: 'p1_plus' | 'p2_plus' | 'even' | 'unknown';
  p1_state?: string;
  p2_state?: string;
}

/**
 * Daily mission in analysis
 */
export interface DailyMission {
  title: string;
  drill_steps: string[];
  goal: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Export character types
export * from './character';

// Export character encyclopedia types
export * from './characterEncyclopedia';

// Export game types
export * from './game';

// Export game metadata types
export * from './gameMetadata';
