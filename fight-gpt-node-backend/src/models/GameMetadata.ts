import mongoose, { Document, Schema } from 'mongoose';
import { IGameMetadata } from '../types/gameMetadata';

/**
 * Game Metadata Document Interface
 */
export interface IGameMetadataDocument extends Omit<IGameMetadata, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Game Rule Schema
 */
const GameRuleSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    ui_type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  }
);

/**
 * Game Constants Schema
 */
const GameConstantsSchema: Schema = new Schema(
  {
    team_size: {
      type: Number,
    },
    has_air_dash: {
      type: Boolean,
    },
    has_3d_movement: {
      type: Boolean,
    },
    has_assists: {
      type: Boolean,
    },
    has_dhc: {
      type: Boolean,
    },
    has_team_supers: {
      type: Boolean,
    },
    max_meter: {
      type: Number,
    },
  },
  {
    _id: false,
    strict: false, // Allow additional properties
  }
);

/**
 * Game Metadata Schema
 */
const GameMetadataSchema: Schema = new Schema(
  {
    game_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    global_mechanics: {
      type: [GameRuleSchema],
      required: true,
      default: [],
    },
    constants: {
      type: GameConstantsSchema,
      required: true,
    },
    patch_version: {
      type: String,
      index: true,
      trim: true,
    },
    is_current: {
      type: Boolean,
      default: true,
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

// Compound indexes
GameMetadataSchema.index({ game_id: 1, is_current: 1 });
GameMetadataSchema.index({ game_id: 1, patch_version: 1 });

// Text index for search
GameMetadataSchema.index({
  'global_mechanics.key': 'text',
  'global_mechanics.description': 'text',
});

/**
 * Game Metadata Model
 */
export const GameMetadata = mongoose.model<IGameMetadataDocument>(
  'GameMetadata',
  GameMetadataSchema
);
