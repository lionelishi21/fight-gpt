import { BaseRepository } from './BaseRepository';
import { Rival, IRivalDocument } from '../models/Rival';

export interface IRivalRepository {
    createRival(data: any): Promise<IRivalDocument>;
    getRivalsByUserId(userId: string): Promise<IRivalDocument[]>;
    findByTargetName(targetName: string, gameId: string): Promise<IRivalDocument[]>;
}

export class RivalRepository extends BaseRepository<IRivalDocument> implements IRivalRepository {
    constructor() {
        super(Rival);
    }

    public async createRival(data: any): Promise<IRivalDocument> {
        return this.model.create(data);
    }

    public async getRivalsByUserId(userId: string): Promise<IRivalDocument[]> {
        return this.model.find({ userId }).exec();
    }

    public async findByTargetName(targetName: string, gameId: string): Promise<IRivalDocument[]> {
        return this.model.find({ 
            targetName: { $regex: new RegExp(`^${targetName}$`, 'i') }, 
            gameId 
        }).exec();
    }
}

export default RivalRepository;
