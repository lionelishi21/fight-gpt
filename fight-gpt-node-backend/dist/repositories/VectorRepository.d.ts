import { BaseRepository } from './BaseRepository';
import { IScenarioDocument } from '../models/Scenario';
export interface IVectorRepository {
    createScenario(data: Partial<IScenarioDocument>): Promise<IScenarioDocument>;
    findSimilarScenarios(vector: number[], gameId: string, limit?: number): Promise<IScenarioDocument[]>;
    addMatchReference(scenarioId: string, analysisId: string): Promise<void>;
}
export declare class VectorRepository extends BaseRepository<IScenarioDocument> implements IVectorRepository {
    constructor();
    createScenario(data: Partial<IScenarioDocument>): Promise<IScenarioDocument>;
    /**
     * Performs an Atlas Vector Search to find similar pro-match scenarios
     * based on the provided embedding vector representing the player's mistake/state.
     *
     * Pre-requisite: An Atlas Vector Search index needs to be created on the `Scenario` collection.
     */
    findSimilarScenarios(vector: number[], gameId: string, limit?: number): Promise<IScenarioDocument[]>;
    addMatchReference(scenarioId: string, analysisId: string): Promise<void>;
}
export default VectorRepository;
//# sourceMappingURL=VectorRepository.d.ts.map