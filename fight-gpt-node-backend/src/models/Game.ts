import mongoose, { Document, Schema } from 'mongoose';
import { IGame } from '../types/game';

/**
 * Game document interface extending mongoose Document
 */
export interface IGameDocument extends IGame, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Game schema definition
 */
const GameSchema: Schema = new Schema(
  {
    game_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true, // Store as lowercase for consistency
      trim: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    full_name: {
      type: String,
      trim: true,
    },
    publisher: {
      type: String,
      index: true,
      trim: true,
    },
    developer: {
      type: String,
      index: true,
      trim: true,
    },
    release_date: {
      type: Date,
    },
    genre: {
      type: String,
      index: true,
      default: 'Fighting',
      trim: true,
    },
    platform: {
      type: [String],
      default: [],
    },
    icon_url: {
      type: String,
      trim: true,
    },
    banner_url: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    supported_characters_count: {
      type: Number,
      default: 0,
    },
    latest_version: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound indexes for common queries
GameSchema.index({ is_active: 1, name: 1 });
GameSchema.index({ publisher: 1, is_active: 1 });
GameSchema.index({ developer: 1, is_active: 1 });

// Text index for search
GameSchema.index({ name: 'text', full_name: 'text', description: 'text' });

// Ensure game_id is unique and lowercase
GameSchema.pre('save', function (next) {
  if (this.isModified('game_id')) {
    this.game_id = this.game_id.toLowerCase().trim();
  }
  next();
});

/**
 * Game model
 */
export const Game = mongoose.model<IGameDocument>('Game', GameSchema);


