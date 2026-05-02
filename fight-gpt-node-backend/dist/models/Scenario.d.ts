import mongoose, { Document } from 'mongoose';
export interface IScenario {
    scenario_id: string;
    game_id: string;
    pro_player_id?: string;
    description: string;
    context: string;
    characters_involved: string[];
    embedding: number[];
    match_references: string[];
    tags: string[];
    turn_owner?: 'p1' | 'p2' | 'neutral' | 'contested';
    neutral_state?: 'neutral' | 'p1_offense' | 'p2_offense' | 'scramble';
    spacing?: 'close' | 'mid' | 'far' | 'corner_p1' | 'corner_p2';
    frame_advantage?: 'p1_plus' | 'p2_plus' | 'even' | 'unknown';
    p1_state?: string;
    p2_state?: string;
    timestamp?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface IScenarioDocument extends IScenario, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const Scenario: mongoose.Model<IScenarioDocument, {}, {}, {}, mongoose.Document<unknown, {}, IScenarioDocument, {}, {}> & IScenarioDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Scenario.d.ts.map