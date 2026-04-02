import mongoose, { Document, Schema } from 'mongoose';

/**
 * Frame Data Schema
 */
const FrameDataSchema: Schema = new Schema(
  {
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
    damage: {
      type: Number,
    },
  },
  {
    _id: false,
  }
);

/**
 * Move Requirements Schema (for team-based moves)
 */
const MoveRequirementsSchema: Schema = new Schema(
  {
    meter_cost: {
      type: Number,
    },
    assist_slot: {
      type: Number,
    },
    dhc_order: {
      type: Number,
    },
  },
  {
    _id: false,
  }
);

/**
 * Move Schema
 */
const MoveSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    input: {
      type: String,
      required: true,
      trim: true,
    },
    how_to_perform: {
      type: String,
      required: true,
      trim: true,
    },
    button_press: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ['normal', 'special', 'ex', 'super', 'unique_action', 'assist', 'dhc', 'team_super'],
      required: true,
    },
    properties: {
      type: [String],
      default: [],
    },
    frame_data: {
      type: FrameDataSchema,
      required: true,
    },
    // Team-based move properties
    team_member: {
      type: String,
      trim: true,
    },
    team_position: {
      type: Number,
    },
    requirements: {
      type: MoveRequirementsSchema,
    },
  },
  {
    _id: false,
  }
);

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
 * Video Schema
 */
const VideoSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    youtube_id: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['guide', 'match', 'combo'],
      required: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/**
 * Combo Schema
 */
const ComboSchema: Schema = new Schema(
  {
    inputs: {
      type: [String],
      required: true,
    },
    damage: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    video_url: {
      type: String,
      trim: true,
    },
    drive_gauge: {
      type: String,
      trim: true,
    },
    super_gauge: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/**
 * Moveset Schema
 */
const MovesetSchema: Schema = new Schema(
  {
    normals: {
      type: [MoveSchema],
      default: [],
    },
    specials: {
      type: [MoveSchema],
      default: [],
    },
    ex_moves: {
      type: [MoveSchema],
      default: [],
    },
    supers: {
      type: [MoveSchema],
      default: [],
    },
    // Team-based moves
    assists: {
      type: [MoveSchema],
      default: [],
    },
    dhc: {
      type: [MoveSchema],
      default: [],
    },
    team_supers: {
      type: [MoveSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/**
 * Legacy Moveset Schema (for version/patch tracking)
 */
const LegacyMovesetSchema: Schema = new Schema(
  {
    patch_version: {
      type: String,
      required: true,
      trim: true,
    },
    moveset: {
      type: MovesetSchema,
      required: true,
    },
    game_rules: {
      type: [GameRuleSchema],
      default: [],
    },
    patch_notes: {
      type: String,
      trim: true,
    },
    last_updated: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

/**
 * Character Encyclopedia Document Interface
 */
export interface ICharacterEncyclopediaDocument extends Document {
  _id: mongoose.Types.ObjectId;
  game_id: string;
  character_id: string;
  patch_version: string;
  is_current_patch: boolean;
  moveset: {
    normals: MoveDocument[];
    specials: MoveDocument[];
    ex_moves: MoveDocument[];
    supers: MoveDocument[];
    assists?: MoveDocument[];
    dhc?: MoveDocument[];
    team_supers?: MoveDocument[];
  };
  game_rules: GameRuleDocument[];
  videos?: {
    title: string;
    youtube_id: string;
    category: 'guide' | 'match' | 'combo';
    thumbnail?: string;
  }[];
  combos?: {
    inputs: string[];
    damage: number;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    tags: string[];
    description?: string;
    video_url?: string;
    drive_gauge?: string;
    super_gauge?: string;
  }[];
  legacy_movesets?: LegacyMovesetDocument[];
  last_updated: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Move Document Interface
 */
export interface MoveDocument {
  name: string;
  input: string;
  how_to_perform: string;
  button_press?: string[];
  category: 'normal' | 'special' | 'ex' | 'super' | 'unique_action' | 'assist' | 'dhc' | 'team_super';
  properties?: string[];
  frame_data: {
    startup: number;
    active: number;
    recovery: number;
    on_block: number;
    on_hit?: number;
    damage?: number;
  };
  team_member?: string;
  team_position?: number;
  requirements?: {
    meter_cost?: number;
    assist_slot?: number;
    dhc_order?: number;
  };
}

/**
 * Game Rule Document Interface
 */
export interface GameRuleDocument {
  key: string;
  value: unknown;
  ui_type: string;
  description?: string;
  metadata?: {
    [key: string]: unknown;
  };
}

/**
 * Legacy Moveset Document Interface
 */
export interface LegacyMovesetDocument {
  patch_version: string;
  moveset: {
    normals: MoveDocument[];
    specials: MoveDocument[];
    ex_moves: MoveDocument[];
    supers: MoveDocument[];
    assists?: MoveDocument[];
    dhc?: MoveDocument[];
    team_supers?: MoveDocument[];
  };
  game_rules: GameRuleDocument[];
  patch_notes?: string;
  last_updated?: Date;
}

/**
 * Character Encyclopedia Schema
 */
const CharacterEncyclopediaSchema: Schema = new Schema(
  {
    game_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    character_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    patch_version: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    is_current_patch: {
      type: Boolean,
      default: true,
      index: true,
    },
    moveset: {
      type: MovesetSchema,
      required: true,
    },
    game_rules: {
      type: [GameRuleSchema],
      default: [],
    },
    videos: {
      type: [VideoSchema],
      default: [],
    },
    combos: {
      type: [ComboSchema],
      default: [],
    },
    legacy_movesets: {
      type: [LegacyMovesetSchema],
      default: [],
    },
    last_updated: {
      type: Date,
      default: Date.now,
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
CharacterEncyclopediaSchema.index({ game_id: 1, character_id: 1 });
CharacterEncyclopediaSchema.index({ game_id: 1, character_id: 1, patch_version: 1 });
CharacterEncyclopediaSchema.index({ game_id: 1, character_id: 1, is_current_patch: 1 });
CharacterEncyclopediaSchema.index({ game_id: 1, is_current_patch: 1 });

// Text index for search
CharacterEncyclopediaSchema.index({
  character_id: 'text',
  'moveset.normals.name': 'text',
  'moveset.specials.name': 'text',
  'moveset.ex_moves.name': 'text',
  'moveset.supers.name': 'text',
  'moveset.assists.name': 'text',
  'moveset.dhc.name': 'text',
  'moveset.team_supers.name': 'text',
});

/**
 * Character Encyclopedia Model
 */
export const CharacterEncyclopedia = mongoose.model<ICharacterEncyclopediaDocument>(
  'CharacterEncyclopedia',
  CharacterEncyclopediaSchema
);
