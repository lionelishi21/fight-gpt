import { BaseRepository } from './BaseRepository';
import { Rival, IRivalDocument } from '../models/Rival';

export interface IRivalRepository {
    createRival(data: any): Promise<IRivalDocument>;
    getRivalsByUserId(userId: string): Promise<IRivalDocument[]>;
    findByTargetName(targetName: string, gameId: string): Promise<IRivalDocument[]>;
    deleteForUser(id: string, userId: string): Promise<boolean>;
}

export class RivalRepository extends BaseRepository<IRivalDocument> implements IRivalRepository {
    constructor() {
        super(Rival);
    }

    public async createRival(data: any): Promise<IRivalDocument> {
        return this.model.create(data);
    }

    public async getRivalsByUserId(userId: string): Promise<IRivalDocument[]> {
        return this.model.find({ userId }).sort({ createdAt: -1 }).exec();
    }

    public async deleteForUser(id: string, userId: string): Promise<boolean> {
        const result = await this.model.deleteOne({ _id: id, userId }).exec();
        return result.deletedCount > 0;
    }

    public async findByTargetName(targetName: string, gameId: string): Promise<IRivalDocument[]> {
        return this.model.find({ 
            targetName: { $regex: new RegExp(`^${targetName}$`, 'i') }, 
            gameId 
        }).exec();
    }
}

export default RivalRepository;
