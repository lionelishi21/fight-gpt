import mongoose, { Document, Schema } from 'mongoose';

export interface ITournamentResult {
    placement: number;
    player_name: string;
    character?: string;
    pro_player_id?: string;
    start_gg_player_id?: string;
}

export interface ITournament {
    tournament_id: string;
    name: string;
    game_id: string;
    start_gg_id?: string;
    slug?: string;
    start_at: Date;
    end_at?: Date;
    status: 'upcoming' | 'live' | 'completed';
    prize_pool?: string;
    entrant_count?: number;
    region: string;
    url?: string;
    results: ITournamentResult[];
    vod_urls: string[];
    vods_ingested: boolean;
    city?: string;
    country?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ITournamentDocument extends ITournament, Document {}

const TournamentResultSchema = new Schema<ITournamentResult>({
    placement: { type: Number, required: true },
    player_name: { type: String, required: true },
    character: { type: String },
    pro_player_id: { type: String },
    start_gg_player_id: { type: String },
}, { _id: false });

const TournamentSchema = new Schema<ITournamentDocument>({
    tournament_id:  { type: String, required: true, unique: true, index: true },
    name:           { type: String, required: true },
    game_id:        { type: String, required: true, index: true },
    start_gg_id:    { type: String, index: true, sparse: true },
    slug:           { type: String, index: true, sparse: true },
    start_at:       { type: Date, required: true, index: true },
    end_at:         { type: Date },
    status:         { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
    prize_pool:     { type: String },
    entrant_count:  { type: Number },
    region:         { type: String, default: 'Global' },
    url:            { type: String },
    results:        { type: [TournamentResultSchema], default: [] },
    vod_urls:       { type: [String], default: [] },
    vods_ingested:  { type: Boolean, default: false },
    city:           { type: String },
    country:        { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TournamentSchema.index({ game_id: 1, start_at: -1 });
TournamentSchema.index({ status: 1, start_at: 1 });

export const Tournament = mongoose.model<ITournamentDocument>('Tournament', TournamentSchema);
