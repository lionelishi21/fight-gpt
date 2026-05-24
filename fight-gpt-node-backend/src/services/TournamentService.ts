import { BaseService } from './BaseService';
import { ITournamentRepository } from '../repositories/TournamentRepository';
import { ITournamentDocument } from '../models/Tournament';
import { IIngestionService } from './IngestionService';
import { UuidHelper } from '../helpers/uuidHelper';
import { Logger } from '../helpers/logger';
import { ApiResponse } from '../types';

// Start.gg videogame IDs
const STARTGG_GAME_IDS: Record<string, number> = {
    sf6:     43868,
    tekken8: 43639,
    ggst:    33945,
    mk1:     49783,
    dbfz:    287,
};

const GAME_ID_REVERSE: Record<number, string> = Object.fromEntries(
    Object.entries(STARTGG_GAME_IDS).map(([k, v]) => [v, k])
);

export interface ITournamentService {
    getUpcoming(gameId?: string): Promise<ApiResponse<ITournamentDocument[]>>;
    getCompleted(gameId?: string): Promise<ApiResponse<ITournamentDocument[]>>;
    getResults(tournamentId: string): Promise<ApiResponse<ITournamentDocument>>;
    syncFromStartGg(gameIds?: string[]): Promise<ApiResponse<{ synced: number; errors: string[] }>>;
    syncResults(tournamentId: string): Promise<ApiResponse<{ placements: number }>>;
    queueTournamentVods(tournamentId: string): Promise<ApiResponse<{ queued: number }>>;
}

export class TournamentService extends BaseService implements ITournamentService {
    constructor(
        private readonly tournamentRepository: ITournamentRepository,
        private readonly ingestionService?: IIngestionService,
        private readonly startGgToken?: string,
    ) {
        super();
    }

    async getUpcoming(gameId?: string): Promise<ApiResponse<ITournamentDocument[]>> {
        try {
            const dbResults = await this.tournamentRepository.findUpcoming(gameId);
            if (dbResults.length > 0) {
                return { success: true, data: dbResults };
            }
            // DB is empty — sync from Start.gg on the fly
            await this.syncFromStartGg(gameId ? [gameId] : undefined);
            const fresh = await this.tournamentRepository.findUpcoming(gameId);
            return { success: true, data: fresh };
        } catch (error) {
            throw this.handleError(error, 'getUpcoming');
        }
    }

    async getCompleted(gameId?: string): Promise<ApiResponse<ITournamentDocument[]>> {
        try {
            const results = await this.tournamentRepository.findCompleted(gameId);
            return { success: true, data: results };
        } catch (error) {
            throw this.handleError(error, 'getCompleted');
        }
    }

    async getResults(tournamentId: string): Promise<ApiResponse<ITournamentDocument>> {
        try {
            const t = await this.tournamentRepository.findById(tournamentId);
            if (!t) return { success: false, error: 'Tournament not found' };
            return { success: true, data: t };
        } catch (error) {
            throw this.handleError(error, 'getResults');
        }
    }

    /**
     * Pull upcoming tournaments from Start.gg and save/update them in MongoDB.
     */
    async syncFromStartGg(gameIds?: string[]): Promise<ApiResponse<{ synced: number; errors: string[] }>> {
        const token = this.startGgToken || process.env.START_GG_TOKEN;
        const errors: string[] = [];
        let synced = 0;

        if (!token) {
            return { success: false, error: 'START_GG_TOKEN not configured' };
        }

        const targetGameIds = gameIds || Object.keys(STARTGG_GAME_IDS);
        const startGgIds = targetGameIds
            .map(id => STARTGG_GAME_IDS[id])
            .filter(Boolean);

        const query = `
            query UpcomingTournaments($gameIds: [ID]) {
                tournaments(query: {
                    perPage: 20,
                    filter: {
                        videogameIds: $gameIds
                        upcoming: true
                    }
                }) {
                    nodes {
                        id
                        name
                        slug
                        startAt
                        endAt
                        url
                        city
                        countryCode
                        events(filter: { videogameId: $gameIds }) {
                            id
                            numEntrants
                            videogame { id name }
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch('https://api.start.gg/gql/alpha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ query, variables: { gameIds: startGgIds } }),
            });

            if (!response.ok) {
                return { success: false, error: `Start.gg API error: ${response.status}` };
            }

            const json = await response.json();
            const nodes = json.data?.tournaments?.nodes || [];

            for (const t of nodes) {
                try {
                    const mainEvent = t.events?.[0];
                    const sgGameId = mainEvent?.videogame?.id;
                    const gameId = GAME_ID_REVERSE[sgGameId] || 'sf6';
                    const startAt = new Date(t.startAt * 1000);
                    const endAt = t.endAt ? new Date(t.endAt * 1000) : undefined;
                    const now = new Date();
                    const status: ITournamentDocument['status'] =
                        endAt && endAt < now ? 'completed' :
                        startAt <= now ? 'live' : 'upcoming';

                    await this.tournamentRepository.upsertByStartGgId(String(t.id), {
                        tournament_id: UuidHelper.generate(),
                        name: t.name,
                        game_id: gameId,
                        start_gg_id: String(t.id),
                        slug: t.slug,
                        start_at: startAt,
                        end_at: endAt,
                        status,
                        entrant_count: mainEvent?.numEntrants || 0,
                        region: t.countryCode || 'Global',
                        city: t.city,
                        country: t.countryCode,
                        url: t.url?.startsWith('http') ? t.url : `https://start.gg${t.url || ''}`,
                    });
                    synced++;
                } catch (e) {
                    errors.push(`Tournament ${t.id}: ${e instanceof Error ? e.message : e}`);
                }
            }

            Logger.info(`[TournamentService] Synced ${synced} tournaments from Start.gg`);
            return { success: true, data: { synced, errors } };
        } catch (error) {
            throw this.handleError(error, 'syncFromStartGg');
        }
    }

    /**
     * Fetch top-8 results for a completed tournament from Start.gg.
     */
    async syncResults(tournamentId: string): Promise<ApiResponse<{ placements: number }>> {
        const token = this.startGgToken || process.env.START_GG_TOKEN;
        if (!token) return { success: false, error: 'START_GG_TOKEN not configured' };

        const t = await this.tournamentRepository.findById(tournamentId);
        if (!t) return { success: false, error: 'Tournament not found' };
        if (!t.start_gg_id && !t.slug) return { success: false, error: 'No Start.gg ID on this tournament' };

        const query = `
            query TournamentResults($slug: String) {
                tournament(slug: $slug) {
                    events {
                        standings(query: { perPage: 8, page: 1 }) {
                            nodes {
                                placement
                                entrant {
                                    name
                                    participants {
                                        player {
                                            id
                                            gamerTag
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch('https://api.start.gg/gql/alpha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ query, variables: { slug: t.slug } }),
            });

            if (!response.ok) throw new Error(`Start.gg API error: ${response.status}`);

            const json = await response.json();
            const standings = json.data?.tournament?.events?.[0]?.standings?.nodes || [];

            const results: ITournamentDocument['results'] = standings.map((s: any) => ({
                placement: s.placement,
                player_name: s.entrant?.participants?.[0]?.player?.gamerTag || s.entrant?.name || 'Unknown',
                start_gg_player_id: String(s.entrant?.participants?.[0]?.player?.id || ''),
            }));

            await this.tournamentRepository.updateResults(tournamentId, results);
            Logger.info(`[TournamentService] Synced ${results.length} placements for tournament ${tournamentId}`);
            return { success: true, data: { placements: results.length } };
        } catch (error) {
            throw this.handleError(error, 'syncResults');
        }
    }

    /**
     * Search YouTube for tournament VODs and queue them via IngestionService.
     */
    async queueTournamentVods(tournamentId: string): Promise<ApiResponse<{ queued: number }>> {
        if (!this.ingestionService) {
            return { success: false, error: 'IngestionService not available' };
        }

        const t = await this.tournamentRepository.findById(tournamentId);
        if (!t) return { success: false, error: 'Tournament not found' };

        const queries = [
            `${t.name} top 8 grand finals`,
            `${t.name} top 8 set`,
        ];

        let totalQueued = 0;
        const vodUrls: string[] = [];

        for (const query of queries) {
            try {
                const result = await this.ingestionService.triggerWithQuery(t.game_id, query, 5);
                if (result.success && result.data) {
                    totalQueued += result.data.queued_count;
                }
            } catch (e) {
                Logger.warn(`[TournamentService] VOD queue failed for query "${query}": ${e instanceof Error ? e.message : e}`);
            }
        }

        // Record the queries used as reference URLs since we don't get back individual URLs from the ingestion service
        if (totalQueued > 0) {
            vodUrls.push(...queries.map(q => `yt-search:${encodeURIComponent(q)}`));
        }

        await this.tournamentRepository.markVodsIngested(tournamentId, vodUrls);
        Logger.info(`[TournamentService] Queued ${totalQueued} VODs for tournament ${tournamentId}`);
        return { success: true, data: { queued: totalQueued } };
    }
}
