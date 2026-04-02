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
 * Analysis request payload
 */
export interface AnalysisRequest {
  youtube_url?: string;
  video_path?: string;
  game_id?: string;
  p1_character_id?: string;
  p2_character_id?: string;
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
}

/**
 * Analysis response from AI service
 */
export interface AnalysisResponse {
  status: string;
  source: string;
  video_source?: string;
  game_title?: string;
  p1_character?: string;
  p2_character?: string;
  match_winner?: string;
  timeline?: TimelineEvent[];
  top_3_tips?: string[];
  daily_mission?: DailyMission;
  cached?: boolean;
  analysis_id?: string;
}

/**
 * Timeline event in analysis
 */
export interface TimelineEvent {
  timestamp: string;
  event_type: 'punish_missed' | 'bad_habit' | 'pro_move' | 'neutral_loss';
  description: string;
  coach_advice: string;
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
