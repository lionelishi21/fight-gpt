import { BaseRepository } from './BaseRepository';
import { IMatchDocument, Match } from '../models/Match';

export interface IMatchRepository {
    create(data: Partial<IMatchDocument>): Promise<IMatchDocument>;
    findById(id: string): Promise<IMatchDocument | null>;
    findByMatchId(matchId: string): Promise<IMatchDocument | null>;
    findByGameId(gameId: string, limit?: number, skip?: number): Promise<IMatchDocument[]>;
    findByPlayer(playerName: string, limit?: number, skip?: number): Promise<IMatchDocument[]>;
    update(id: string, data: Partial<IMatchDocument>): Promise<IMatchDocument | null>;
    delete(id: string): Promise<boolean>;
    find(query: any, limit: number): Promise<IMatchDocument[]>;
}

export class MatchRepository extends BaseRepository<IMatchDocument> implements IMatchRepository {
    constructor() {
        super(Match);
    }

    // Removed: protected model: Model<IMatchDocument> = Match;

    public async create(data: Partial<IMatchDocument>): Promise<IMatchDocument> {
        const doc = await this.model.create(data);
        return doc;
    }

    public async findById(id: string): Promise<IMatchDocument> {
        const doc = await this.model.findById(id).exec();
        if (!doc) {
            throw new Error(`Match with id ${id} not found.`);
        }
        return doc;
    }

    public async findByMatchId(matchId: string): Promise<IMatchDocument> {
        const doc = await this.model.findOne({ match_id: matchId }).exec();
        if (!doc) {
            throw new Error(`Match with match_id ${matchId} not found.`);
        }
        return doc;
    }

    public async findByGameId(gameId: string, limit: number = 20, skip: number = 0): Promise<IMatchDocument[]> {
        return this.model.find({ game_id: gameId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }

    public async findByPlayer(playerName: string, limit: number = 20, skip: number = 0): Promise<IMatchDocument[]> {
        return this.model.find({
            $or: [
                { 'player1.name': playerName },
                { 'player2.name': playerName }
            ]
        })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }

    public async find(query: any, limit: number = 10): Promise<IMatchDocument[]> {
        return this.model.find(query)
            .sort({ created_at: -1 })
            .limit(limit)
            .exec();
    }
}

export default MatchRepository;
