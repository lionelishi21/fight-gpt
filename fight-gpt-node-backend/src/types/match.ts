export type EventType =
    | 'neutral_win'
    | 'punish'
    | 'whiff_punish'
    | 'anti_air'
    | 'combo'
    | 'drop'
    | 'blockstring'
    | 'throw'
    | 'tech'
    | 'oki'
    | 'burst'
    // Team game specific
    | 'assist_call'
    | 'dhc' // Delayed Hyper Combo / Team Super
    | 'tag' // Raw tag
    | 'happy_birthday' // Hitting point + assist simultaneously
    | 'snapback' // Forcing opponent to tag out
    | 'character_kill';

export interface MatchEvent {
    timestamp: string; // e.g. "01:23"
    event_type: EventType;
    actor: 'player1' | 'player2';
    description: string;
    significance: string;
    tags?: string[];

    // Team mechanics tracking
    active_character?: string;
    assist_character?: string; // If an assist was involved
    target_character?: string; // If affecting a specific character
    target_assist?: string; // Used for happy birthdays
}

export interface MatchCharacter {
    character_id: string;
    status: 'active' | 'bench' | 'dead';
    position: number; // 1 for point, 2 for mid, 3 for anchor
    assists?: string[]; // e.g., ["A", "B", "Y"] or "Alpha" depending on game
}

export interface MatchPlayer {
    player_id?: string;
    name: string;
    team: MatchCharacter[];
    score?: number;
}

export interface IMatch {
    match_id: string;
    game_id: string;
    format: '1v1' | '2v2' | '3v3';
    player1: MatchPlayer;
    player2: MatchPlayer;
    winner?: 'player1' | 'player2' | 'draw';
    events: MatchEvent[];
    video_url?: string;
    analysis_summary?: string;
    created_at?: Date;
    updated_at?: Date;
}
