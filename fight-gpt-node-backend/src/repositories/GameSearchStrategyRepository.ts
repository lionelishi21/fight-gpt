import { BaseRepository } from './BaseRepository';
import { GameSearchStrategy, IGameSearchStrategy } from '../models/GameSearchStrategy';

export interface IGameSearchStrategyRepository {
    findActive(gameId: string): Promise<IGameSearchStrategy[]>;
    create(data: Partial<IGameSearchStrategy>): Promise<IGameSearchStrategy>;
    deactivate(id: string): Promise<void>;
    findByGame(gameId: string): Promise<IGameSearchStrategy[]>;
}

export class GameSearchStrategyRepository
    extends BaseRepository<IGameSearchStrategy>
    implements IGameSearchStrategyRepository
{
    constructor() {
        super(GameSearchStrategy);
    }

    /** Returns active strategies for a game, highest priority first. */
    async findActive(gameId: string): Promise<IGameSearchStrategy[]> {
        return this.model
            .find({ game_id: gameId, is_active: true })
            .sort({ priority: -1, created_at: -1 })
            .lean()
            .exec() as unknown as IGameSearchStrategy[];
    }

    async findByGame(gameId: string): Promise<IGameSearchStrategy[]> {
        return this.model
            .find({ game_id: gameId })
            .sort({ priority: -1, created_at: -1 })
            .lean()
            .exec() as unknown as IGameSearchStrategy[];
    }

    async create(data: Partial<IGameSearchStrategy>): Promise<IGameSearchStrategy> {
        return this.model.create(data) as unknown as IGameSearchStrategy;
    }

    async deactivate(id: string): Promise<void> {
        await this.model.findByIdAndUpdate(id, { is_active: false });
    }
}
