import mongoose, { Document, Schema } from 'mongoose';
import { AnalysisResponse } from '../types';

/**
 * Analysis document interface extending mongoose Document
 */
export interface IAnalysis extends Document {
  youtube_url?: string;
  video_path?: string;
  video_source: 'youtube' | 'local_file';
  game_id?: string;
  user_id?: string;
  analysis: AnalysisResponse;
  analysis_id: string;
  p1_name?: string;
  p2_name?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Analysis schema definition
 */
const AnalysisSchema: Schema = new Schema(
  {
    youtube_url: {
      type: String,
      index: true,
      sparse: true,
    },
    video_path: {
      type: String,
      index: true,
      sparse: true,
    },
    video_source: {
      type: String,
      enum: ['youtube', 'local_file'],
      required: true,
    },
    game_id: {
      type: String,
      index: true,
    },
    analysis: {
      type: Schema.Types.Mixed,
      required: true,
    },
    analysis_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      index: true,
      sparse: true,
    },
    p1_name: {
      type: String,
      index: true,
    },
    p2_name: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound index for cache lookup
AnalysisSchema.index({ youtube_url: 1, video_source: 1 }, { sparse: true });
AnalysisSchema.index({ video_path: 1, video_source: 1 }, { sparse: true });

/**
 * Analysis model
 */
export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

