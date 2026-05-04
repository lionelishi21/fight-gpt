import mongoose, { Document } from 'mongoose';
export type TheoryType = 'character' | 'matchup' | 'meta';
export type SkillLevel = 'Rookie' | 'Intermediate' | 'Pro';
export interface ITheoryDocument {
    theory_id: string;
    game_id: string;
    type: TheoryType;
    target_skill_level: SkillLevel;
    character_id?: string;
    character_name?: string;
    character_a?: string;
    character_b?: string;
    title: string;
    summary: string;
    full_theory: string;
    key_strengths: string[];
    key_weaknesses: string[];
    win_conditions: string[];
    counterplay: string[];
    source_scenario_count: number;
    confidence: 'low' | 'medium' | 'high';
    patch_version?: string;
    is_current_patch: boolean;
    vortex_graph?: {
        nodes: Array<{
            id: string;
            label: string;
            description: string;
            type: 'neutral' | 'pressure' | 'finisher' | 'reset';
        }>;
        edges: Array<{
            source: string;
            target: string;
            label?: string;
        }>;
    };
    generated_at: Date;
    created_at?: Date;
    updated_at?: Date;
    status: 'pending' | 'approved' | 'rejected';
}
export interface ITheoryDocumentDocument extends ITheoryDocument, Document {
    _id: mongoose.Types.ObjectId;
}
export declare const TheoryDoc: mongoose.Model<ITheoryDocumentDocument, {}, {}, {}, mongoose.Document<unknown, {}, ITheoryDocumentDocument, {}, {}> & ITheoryDocumentDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TheoryDocument.d.ts.map