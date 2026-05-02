import { BaseRepository } from './BaseRepository';
import { IRivalDocument } from '../models/Rival';
export interface IRivalRepository {
    createRival(data: any): Promise<IRivalDocument>;
    getRivalsByUserId(userId: string): Promise<IRivalDocument[]>;
    findByTargetName(targetName: string, gameId: string): Promise<IRivalDocument[]>;
}
export declare class RivalRepository extends BaseRepository<IRivalDocument> implements IRivalRepository {
    constructor();
    createRival(data: any): Promise<IRivalDocument>;
    getRivalsByUserId(userId: string): Promise<IRivalDocument[]>;
    findByTargetName(targetName: string, gameId: string): Promise<IRivalDocument[]>;
}
export default RivalRepository;
//# sourceMappingURL=RivalRepository.d.ts.map