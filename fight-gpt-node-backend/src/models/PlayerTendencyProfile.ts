import mongoose, { Document, Schema } from 'mongoose';

export type TendencyOwnerType = 'user' | 'pro_player';

export interface ISequenceChainCount {
  chain: string[];
  count: number;
}

export interface IPlayerTendencyProfile {
  profile_key: string;          // `${owner_type}:${owner_id}:${game_id}:${character_id}`
  owner_type: TendencyOwnerType;
  owner_id: string;
  game_id: string;
  character_id: string;
  move_frequency: Record<string, number>;
  event_type_frequency: Record<string, number>;
  favored_sequence_chains: ISequenceChainCount[];
  sample_count: number;
  embedded_at_sample_count: number; // sample_count value at the last successful embed
  tendency_vector?: number[];
  tendency_summary_text?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPlayerTendencyProfileDocument extends IPlayerTendencyProfile, Document {
  _id: mongoose.Types.ObjectId;
}

const SequenceChainCountSchema = new Schema<ISequenceChainCount>({
  chain: [{ type: String }],
  count: { type: Number, default: 0 },
}, { _id: false });

const PlayerTendencyProfileSchema = new Schema<IPlayerTendencyProfileDocument>({
  profile_key:    { type: String, required: true, unique: true, index: true },
  owner_type:     { type: String, enum: ['user', 'pro_player'], required: true },
  owner_id:       { type: String, required: true, index: true },
  game_id:        { type: String, required: true, index: true },
  character_id:   { type: String, required: true },
  move_frequency:       { type: Schema.Types.Mixed, default: {} },
  event_type_frequency: { type: Schema.Types.Mixed, default: {} },
  favored_sequence_chains: { type: [SequenceChainCountSchema], default: [] },
  sample_count:             { type: Number, default: 0 },
  embedded_at_sample_count: { type: Number, default: 0 },
  tendency_vector:      { type: [Number] },
  tendency_summary_text: { type: String },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

PlayerTendencyProfileSchema.index({ owner_type: 1, owner_id: 1, game_id: 1 });

export const PlayerTendencyProfile = mongoose.model<IPlayerTendencyProfileDocument>(
  'PlayerTendencyProfile',
  PlayerTendencyProfileSchema,
);

export default PlayerTendencyProfile;
