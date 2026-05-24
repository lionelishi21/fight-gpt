import { BaseRepository } from './BaseRepository';
import { ITournamentDocument, Tournament } from '../models/Tournament';

export interface ITournamentRepository {
    upsertByStartGgId(startGgId: string, data: Partial<ITournamentDocument>): Promise<ITournamentDocument>;
    findByGameId(gameId: string, limit?: number): Promise<ITournamentDocument[]>;
    findUpcoming(gameId?: string): Promise<ITournamentDocument[]>;
    findCompleted(gameId?: string, limit?: number): Promise<ITournamentDocument[]>;
    findById(tournamentId: string): Promise<ITournamentDocument | null>;
    findPendingVodIngestion(): Promise<ITournamentDocument[]>;
    markVodsIngested(tournamentId: string, vodUrls: string[]): Promise<void>;
    updateResults(tournamentId: string, results: ITournamentDocument['results']): Promise<void>;
}

export class TournamentRepository extends BaseRepository<ITournamentDocument> implements ITournamentRepository {
    constructor() {
        super(Tournament);
    }

    async upsertByStartGgId(startGgId: string, data: Partial<ITournamentDocument>): Promise<ITournamentDocument> {
        const { tournament_id, ...updateFields } = data as any;
        const doc = await this.model.findOneAndUpdate(
            { start_gg_id: startGgId },
            {
                $set: updateFields,
                // tournament_id is write-once — only set on insert, never overwritten
                $setOnInsert: { tournament_id },
            },
            { upsert: true, new: true }
        );
        return doc!;
    }

    async findByGameId(gameId: string, limit = 20): Promise<ITournamentDocument[]> {
        return this.model
            .find({ game_id: gameId })
            .sort({ start_at: -1 })
            .limit(limit)
            .lean()
            .exec() as unknown as ITournamentDocument[];
    }

    async findUpcoming(gameId?: string): Promise<ITournamentDocument[]> {
        const filter: any = { status: { $in: ['upcoming', 'live'] } };
        if (gameId) filter.game_id = gameId;
        return this.model
            .find(filter)
            .sort({ start_at: 1 })
            .limit(20)
            .lean()
            .exec() as unknown as ITournamentDocument[];
    }

    async findCompleted(gameId?: string, limit = 10): Promise<ITournamentDocument[]> {
        const filter: any = { status: 'completed' };
        if (gameId) filter.game_id = gameId;
        return this.model
            .find(filter)
            .sort({ start_at: -1 })
            .limit(limit)
            .lean()
            .exec() as unknown as ITournamentDocument[];
    }

    async findById(tournamentId: string): Promise<ITournamentDocument | null> {
        return this.model.findOne({ tournament_id: tournamentId }).lean().exec() as unknown as ITournamentDocument | null;
    }

    async findPendingVodIngestion(): Promise<ITournamentDocument[]> {
        return this.model
            .find({ status: 'completed', vods_ingested: false, results: { $ne: [] } })
            .sort({ start_at: -1 })
            .limit(10)
            .lean()
            .exec() as unknown as ITournamentDocument[];
    }

    async markVodsIngested(tournamentId: string, vodUrls: string[]): Promise<void> {
        await this.model.updateOne(
            { tournament_id: tournamentId },
            { $set: { vods_ingested: true }, $addToSet: { vod_urls: { $each: vodUrls } } }
        );
    }

    async updateResults(tournamentId: string, results: ITournamentDocument['results']): Promise<void> {
        await this.model.updateOne(
            { tournament_id: tournamentId },
            { $set: { results, status: 'completed' } }
        );
    }
}
