import mongoose, { Document, Schema } from 'mongoose';
import { CharacterStats, CharacterMove, ICharacter } from '../types/character';

/**
 * Character document interface extending mongoose Document
 */
export interface ICharacterDocument extends Omit<ICharacter, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Character move schema
 */
const CharacterMoveSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    startup: {
      type: Number,
      required: true,
    },
    active: {
      type: Number,
      required: true,
    },
    recovery: {
      type: Number,
      required: true,
    },
    on_block: {
      type: Number,
      required: true,
    },
    on_hit: {
      type: Number,
    },
    on_counter_hit: {
      type: Number,
    },
    damage: {
      type: Number,
    },
    stun: {
      type: Number,
    },
    tags: {
      type: [String],
      required: true,
      enum: [
        'projectile',
        'special',
        'normal',
        'command_normal',
        'super',
        'overdrive',
        'throw',
        'anti_air',
        'low',
        'overhead',
        'meaty',
        'whiff_punish',
      ],
    },
    notes: {
      type: String,
    },
  },
  {
    _id: false, // Don't create _id for subdocuments
  }
);

/**
 * Character stats schema
 */
const CharacterStatsSchema: Schema = new Schema(
  {
    walk_speed: {
      type: Number,
    },
    dash_frames: {
      type: Number,
    },
    jump_speed: {
      type: Number,
    },
    air_dash: {
      type: Boolean,
    },
    backdash_frames: {
      type: Number,
    },
    throw_range: {
      type: Number,
    },
  },
  {
    _id: false,
    strict: false, // Allow additional properties
  }
);

/**
 * Character schema definition
 */
const CharacterSchema: Schema = new Schema(
  {
    game_id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      index: true,
    },
    is_current: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    archetype: {
      type: String,
      index: true,
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 3,
    },
    description: {
      type: String,
    },
    stats: {
      type: CharacterStatsSchema,
      required: true,
    },
    moves: {
      type: [CharacterMoveSchema],
      required: true,
      default: [],
    },
    patch_notes_summary: {
      type: String,
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
CharacterSchema.index({ game_id: 1, name: 1 });
CharacterSchema.index({ game_id: 1, version: 1 });
CharacterSchema.index({ game_id: 1, is_current: 1 });
CharacterSchema.index({ game_id: 1, name: 1, is_current: 1 });

// Text index for search
CharacterSchema.index({ name: 'text', patch_notes_summary: 'text' });

/**
 * Character model
 */
export const Character = mongoose.model<ICharacterDocument>('Character', CharacterSchema);

