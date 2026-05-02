import { IMatchDocument } from '../models/Match';
import { MatchRepository } from '../repositories/MatchRepository';
import { BaseService } from './BaseService';
import { IMatch } from '../types/match';
export interface CreateMatchRequest extends Omit<IMatch, 'match_id' | 'created_at' | 'updated_at'> {
    match_id?: string;
}
export interface UpdateMatchRequest extends Partial<Omit<IMatch, 'match_id' | 'game_id'>> {
}
export declare class MatchService extends BaseService {
    private repository;
    constructor(repository?: MatchRepository);
    createMatch(request: CreateMatchRequest): Promise<IMatchDocument>;
    getMatchById(id: string): Promise<IMatchDocument | null>;
    getMatchByMatchId(matchId: string): Promise<IMatchDocument | null>;
    getMatchesByGameId(gameId: string, page?: number, limit?: number): Promise<IMatchDocument[]>;
    getMatchesByPlayerName(playerName: string, page?: number, limit?: number): Promise<IMatchDocument[]>;
    updateMatch(id: string, request: UpdateMatchRequest): Promise<IMatchDocument | null>;
    deleteMatch(id: string): Promise<boolean>;
    private validateMatchRequest;
}
//# sourceMappingURL=MatchService.d.ts.map