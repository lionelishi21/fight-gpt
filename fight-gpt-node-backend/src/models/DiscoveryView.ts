import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscoveryView extends Document {
  user_id: string;
  analysis_id: string;
  last_viewed_at: Date;
}

const DiscoveryViewSchema: Schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    analysis_id: {
      type: String,
      required: true,
      index: true,
    },
    last_viewed_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Unique index to prevent duplicate view records for the same user/analysis
DiscoveryViewSchema.index({ user_id: 1, analysis_id: 1 }, { unique: true });

export const DiscoveryView = mongoose.model<IDiscoveryView>('DiscoveryView', DiscoveryViewSchema);
