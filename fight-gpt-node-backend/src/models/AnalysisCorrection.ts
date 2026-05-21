import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysisCorrection extends Document {
    analysis_id: string;   // the Analysis._id or analysis_id
    event_node_id: string; // matches timeline[].node_id
    timestamp: string;     // e.g. "01:23"
    original_event_type: string;
    original_description: string;
    original_move_used?: string;
    original_outcome?: string;
    correction: string;    // admin's written correction
    corrected_event_type?: string;
    corrected_move_used?: string;
    corrected_outcome?: string;
    admin_id: string;
    admin_name: string;
    status: 'pending' | 'applied';
    created_at: Date;
}

const schema = new Schema<IAnalysisCorrection>({
    analysis_id:            { type: String, required: true, index: true },
    event_node_id:          { type: String, required: true },
    timestamp:              { type: String, default: '' },
    original_event_type:    { type: String, default: '' },
    original_description:   { type: String, default: '' },
    original_move_used:     { type: String },
    original_outcome:       { type: String },
    correction:             { type: String, required: true },
    corrected_event_type:   { type: String },
    corrected_move_used:    { type: String },
    corrected_outcome:      { type: String },
    admin_id:               { type: String, required: true },
    admin_name:             { type: String, required: true },
    status:                 { type: String, enum: ['pending', 'applied'], default: 'pending' },
    created_at:             { type: Date, default: Date.now },
}, { timestamps: false });

export const AnalysisCorrection = mongoose.model<IAnalysisCorrection>('AnalysisCorrection', schema);
