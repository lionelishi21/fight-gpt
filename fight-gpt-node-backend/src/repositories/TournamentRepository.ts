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
    refreshStatuses(now?: Date): Promise<{ completed: number; live: number }>;
    findCompletedWithoutResults(limit: number): Promise<ITournamentDocument[]>;
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

    /**
     * Status is set when a tournament is synced, so without this an event stays "upcoming"
     * forever. Ended events (or ones with no end date that started 3+ days ago) become
     * completed; started ones become live.
     */
    async refreshStatuses(now = new Date()): Promise<{ completed: number; live: number }> {
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const completed = await this.model.updateMany(
            {
                status: { $ne: 'completed' },
                $or: [{ end_at: { $lt: now } }, { end_at: null, start_at: { $lt: threeDaysAgo } }],
            },
            { $set: { status: 'completed' } }
        );
        const live = await this.model.updateMany(
            { status: 'upcoming', start_at: { $lte: now } },
            { $set: { status: 'live' } }
        );
        return { completed: completed.modifiedCount, live: live.modifiedCount };
    }

    async findCompletedWithoutResults(limit: number): Promise<ITournamentDocument[]> {
        return this.model
            .find({ status: 'completed', results: { $size: 0 } })
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
