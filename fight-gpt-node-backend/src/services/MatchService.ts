import { IMatchDocument } from '../models/Match';
import { MatchRepository } from '../repositories/MatchRepository';
import { BaseService } from './BaseService';
import { v4 as uuidv4 } from 'uuid';
import { IMatch } from '../types/match';

export interface CreateMatchRequest extends Omit<IMatch, 'match_id' | 'created_at' | 'updated_at'> {
    match_id?: string;
}

export interface UpdateMatchRequest extends Partial<Omit<IMatch, 'match_id' | 'game_id'>> { }

export class MatchService extends BaseService {
    private repository: MatchRepository;

    constructor(repository?: MatchRepository) {
        super();
        this.repository = repository || new MatchRepository();
    }

    public async createMatch(request: CreateMatchRequest): Promise<IMatchDocument> {
        this.validateMatchRequest(request);
        const matchId = request.match_id || `match_${uuidv4()}`;
        return this.repository.create({ ...request, match_id: matchId } as any);
    }

    public async getMatchById(id: string): Promise<IMatchDocument | null> {
        try {
            return await this.repository.findById(id);
        } catch {
            return null;
        }
    }

    public async getMatchByMatchId(matchId: string): Promise<IMatchDocument | null> {
        try {
            return await this.repository.findByMatchId(matchId);
        } catch {
            return null;
        }
    }

    public async getMatchesByGameId(gameId: string, page: number = 1, limit: number = 20): Promise<IMatchDocument[]> {
        const skip = (page - 1) * limit;
        return this.repository.findByGameId(gameId, limit, skip);
    }

    public async getMatchesByPlayerName(playerName: string, page: number = 1, limit: number = 20): Promise<IMatchDocument[]> {
        const skip = (page - 1) * limit;
        return this.repository.findByPlayer(playerName, limit, skip);
    }

    public async updateMatch(id: string, request: UpdateMatchRequest): Promise<IMatchDocument | null> {
        return this.repository.update(id, request as any);
    }

    public async deleteMatch(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }

    private validateMatchRequest(request: CreateMatchRequest): void {
        if (!request.game_id) throw new Error('game_id is required');
        if (!request.format) throw new Error('format is required');
        if (!request.player1) throw new Error('player1 is required');
        if (!request.player2) throw new Error('player2 is required');

        const formatSizes: Record<string, number> = { '1v1': 1, '2v2': 2, '3v3': 3 };
        const maxSize = formatSizes[request.format];
        if (!maxSize) throw new Error(`Invalid format: ${request.format}`);
        if (request.player1.team.length > maxSize) throw new Error(`player1 team exceeds size for ${request.format}`);
        if (request.player2.team.length > maxSize) throw new Error(`player2 team exceeds size for ${request.format}`);
    }
}
