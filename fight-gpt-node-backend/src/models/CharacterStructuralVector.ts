import mongoose, { Document, Schema } from 'mongoose';

export interface ICharacterStructuralVector {
  game_id: string;
  character_id: string;     // existing characters: real ID; drafts: a temp/slug ID
  is_draft: boolean;        // true = unreleased/announced-only kit, no match footage
  archetype?: string;
  kit_description_text: string; // the text that was embedded — kept for audit/re-embed
  embedding: number[];
  source: 'encyclopedia' | 'draft_kit_input';
  created_at?: Date;
  updated_at?: Date;
}

export interface ICharacterStructuralVectorDocument extends ICharacterStructuralVector, Document {
  _id: mongoose.Types.ObjectId;
}

const CharacterStructuralVectorSchema = new Schema<ICharacterStructuralVectorDocument>({
  game_id:      { type: String, required: true, index: true },
  character_id: { type: String, required: true },
  is_draft:     { type: Boolean, required: true, default: false, index: true },
  archetype:    { type: String },
  kit_description_text: { type: String, required: true },
  embedding: {
    type: [Number],
    required: true,
  },
  source: { type: String, enum: ['encyclopedia', 'draft_kit_input'], required: true },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

CharacterStructuralVectorSchema.index({ game_id: 1, character_id: 1, is_draft: 1 }, { unique: true });

export const CharacterStructuralVector = mongoose.model<ICharacterStructuralVectorDocument>(
  'CharacterStructuralVector',
  CharacterStructuralVectorSchema,
);

export default CharacterStructuralVector;
