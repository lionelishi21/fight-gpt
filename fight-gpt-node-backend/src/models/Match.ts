import mongoose, { Document, Schema } from 'mongoose';
import { IMatch, MatchPlayer, MatchCharacter, MatchEvent } from '../types/match';

export interface IMatchDocument extends IMatch, Document {
    _id: mongoose.Types.ObjectId;
}

const MatchCharacterSchema = new Schema<MatchCharacter>({
    character_id: { type: String, required: true },
    status: { type: String, enum: ['active', 'bench', 'dead'], required: true },
    position: { type: Number, required: true },
    assists: [{ type: String }]
}, { _id: false });

const MatchPlayerSchema = new Schema<MatchPlayer>({
    player_id: { type: String },
    name: { type: String, required: true },
    team: { type: [MatchCharacterSchema], required: true },
    score: { type: Number }
}, { _id: false });

const MatchEventSchema = new Schema<MatchEvent>({
    timestamp: { type: String, required: true },
    event_type: {
        type: String,
        enum: [
            'neutral_win', 'punish', 'whiff_punish', 'anti_air', 'combo', 'drop',
            'blockstring', 'throw', 'tech', 'oki', 'burst',
            'assist_call', 'dhc', 'tag', 'happy_birthday', 'snapback', 'character_kill'
        ],
        required: true
    },
    actor: { type: String, enum: ['player1', 'player2'], required: true },
    description: { type: String, required: true },
    significance: { type: String, required: true },
    tags: [{ type: String }],
    active_character: { type: String },
    assist_character: { type: String },
    target_character: { type: String },
    target_assist: { type: String }
}, { _id: false });

const MatchSchema = new Schema({
    match_id: { type: String, required: true, unique: true, index: true },
    game_id: { type: String, required: true, index: true },
    format: { type: String, enum: ['1v1', '2v2', '3v3'], required: true },
    player1: { type: MatchPlayerSchema, required: true },
    player2: { type: MatchPlayerSchema, required: true },
    winner: { type: String, enum: ['player1', 'player2', 'draw'] },
    events: { type: [MatchEventSchema], default: [] },
    video_url: { type: String },
    analysis_summary: { type: String }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

MatchSchema.index({ game_id: 1, 'player1.name': 1, 'player2.name': 1 });
MatchSchema.index({ created_at: -1 });

export const Match = mongoose.model<IMatchDocument>('Match', MatchSchema);
