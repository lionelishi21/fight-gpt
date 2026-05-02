export type EventType = 'neutral_win' | 'punish' | 'whiff_punish' | 'anti_air' | 'combo' | 'drop' | 'blockstring' | 'throw' | 'tech' | 'oki' | 'burst' | 'assist_call' | 'dhc' | 'tag' | 'happy_birthday' | 'snapback' | 'character_kill';
export interface MatchEvent {
    timestamp: string;
    event_type: EventType;
    actor: 'player1' | 'player2';
    description: string;
    significance: string;
    tags?: string[];
    active_character?: string;
    assist_character?: string;
    target_character?: string;
    target_assist?: string;
}
export interface MatchCharacter {
    character_id: string;
    status: 'active' | 'bench' | 'dead';
    position: number;
    assists?: string[];
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
//# sourceMappingURL=match.d.ts.map