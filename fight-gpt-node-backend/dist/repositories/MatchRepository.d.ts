import { BaseRepository } from './BaseRepository';
import { IMatchDocument } from '../models/Match';
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
export declare class MatchRepository extends BaseRepository<IMatchDocument> implements IMatchRepository {
    constructor();
    create(data: Partial<IMatchDocument>): Promise<IMatchDocument>;
    findById(id: string): Promise<IMatchDocument>;
    findByMatchId(matchId: string): Promise<IMatchDocument>;
    findByGameId(gameId: string, limit?: number, skip?: number): Promise<IMatchDocument[]>;
    findByPlayer(playerName: string, limit?: number, skip?: number): Promise<IMatchDocument[]>;
    find(query: any, limit?: number): Promise<IMatchDocument[]>;
}
export default MatchRepository;
//# sourceMappingURL=MatchRepository.d.ts.map