import { BaseRepository } from './BaseRepository';
import { IGameSearchStrategy } from '../models/GameSearchStrategy';
export interface IGameSearchStrategyRepository {
    findActive(gameId: string): Promise<IGameSearchStrategy[]>;
    create(data: Partial<IGameSearchStrategy>): Promise<IGameSearchStrategy>;
    deactivate(id: string): Promise<void>;
    findByGame(gameId: string): Promise<IGameSearchStrategy[]>;
}
export declare class GameSearchStrategyRepository extends BaseRepository<IGameSearchStrategy> implements IGameSearchStrategyRepository {
    constructor();
    /** Returns active strategies for a game, highest priority first. */
    findActive(gameId: string): Promise<IGameSearchStrategy[]>;
    findByGame(gameId: string): Promise<IGameSearchStrategy[]>;
    create(data: Partial<IGameSearchStrategy>): Promise<IGameSearchStrategy>;
    deactivate(id: string): Promise<void>;
}
//# sourceMappingURL=GameSearchStrategyRepository.d.ts.map