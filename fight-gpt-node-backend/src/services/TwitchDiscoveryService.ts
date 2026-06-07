import { Logger } from '../helpers/logger';
import { UuidHelper } from '../helpers/uuidHelper';
import { IngestionJob } from '../models/IngestionJob';
import { queueService } from './QueueService';

// Twitch game IDs for each FGC title
// These are Twitch's internal game IDs (different from start.gg IDs)
const TWITCH_GAME_IDS: Record<string, string> = {
    sf6:     '248048',   // Street Fighter 6
    tekken8: '1818062',  // Tekken 8
    ggst:    '511084',   // Guilty Gear: Strive
    mk1:     '1705764',  // Mortal Kombat 1
    dbfz:    '489162',   // Dragon Ball FighterZ
};

// Well-known FGC channels on Twitch that upload tournament VODs
const FGC_CHANNELS: Record<string, string[]> = {
    sf6:     ['topangela', 'capcomfighters', 'nycfurby', 'humanbomb', 'hajimetakamura'],
    tekken8: ['harada_tekken', 'tekken', 'nycfurby', 'mainmansaw'],
    ggst:    ['arcraysofficial', 'nycfurby'],
    mk1:     ['nrs_community', 'kombatleague'],
    dbfz:    ['bandaifightersglobal'],
};

interface TwitchVod {
    id: string;
    user_login: string;
    user_name: string;
    title: string;
    duration: string;
    url: string;
    created_at: string;
    game_id: string;
}

export class TwitchDiscoveryService {
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(clientId?: string, clientSecret?: string) {
        this.clientId = clientId || process.env.TWITCH_CLIENT_ID || '';
        this.clientSecret = clientSecret || process.env.TWITCH_CLIENT_SECRET || '';
    }

    private get isConfigured(): boolean {
        return Boolean(this.clientId && this.clientSecret);
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const res = await fetch(
            `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
            { method: 'POST' }
        );

        if (!res.ok) throw new Error(`Twitch OAuth failed: ${res.status}`);

        const json = await res.json();
        this.accessToken = json.access_token;
        // Expire 5 minutes before actual expiry to avoid edge cases
        this.tokenExpiry = Date.now() + (json.expires_in - 300) * 1000;
        return this.accessToken!;
    }

    private async twitchGet(path: string): Promise<any> {
        const token = await this.getAccessToken();
        const res = await fetch(`https://api.twitch.tv/helix${path}`, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error(`Twitch API error: ${res.status} ${path}`);
        return res.json();
    }

    /**
     * Parses a Twitch duration string like "1h23m45s" into total seconds.
     */
    private parseDuration(dur: string): number {
        const h = parseInt(dur.match(/(\d+)h/)?.[1] || '0', 10);
        const m = parseInt(dur.match(/(\d+)m/)?.[1] || '0', 10);
        const s = parseInt(dur.match(/(\d+)s/)?.[1] || '0', 10);
        return h * 3600 + m * 60 + s;
    }

    /**
     * Fetch recent past-broadcast VODs for a Twitch channel user login.
     * Filters to VODs uploaded in the last 14 days.
     */
    private async getChannelVods(userLogin: string, maxResults = 5): Promise<TwitchVod[]> {
        const json = await this.twitchGet(`/videos?user_login=${userLogin}&type=archive&first=${maxResults}`);
        const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
        return (json.data || []).filter((v: TwitchVod) => {
            const age = new Date(v.created_at).getTime();
            const duration = this.parseDuration(v.duration);
            // Keep VODs from last 14 days that are under 3 hours (individual events, not full day streams)
            return age > cutoff && duration < 3 * 3600;
        });
    }

    /**
     * Fetch recent VODs for a Twitch game category (broader net beyond known channels).
     */
    private async getGameVods(twitchGameId: string, maxResults = 10): Promise<TwitchVod[]> {
        const json = await this.twitchGet(`/videos?game_id=${twitchGameId}&type=archive&first=${maxResults}&sort=time`);
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return (json.data || []).filter((v: TwitchVod) => {
            const age = new Date(v.created_at).getTime();
            const duration = this.parseDuration(v.duration);
            return age > cutoff && duration < 2 * 3600;
        });
    }

    /**
     * Discover Twitch VODs for all configured FGC games and queue them for analysis.
     * Requires streamlink + ffmpeg on the server for the worker to download HLS segments.
     */
    async discoverAndQueue(
        gameIds?: string[],
    ): Promise<{ queued: number; skipped: number; errors: string[] }> {
        if (!this.isConfigured) {
            Logger.warn('[TwitchDiscovery] TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET not set — skipping');
            return { queued: 0, skipped: 0, errors: ['Twitch credentials not configured'] };
        }

        const targetGames = gameIds || Object.keys(TWITCH_GAME_IDS);
        let queued = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const gameId of targetGames) {
            const twitchGameId = TWITCH_GAME_IDS[gameId];
            if (!twitchGameId) continue;

            // Collect VODs from known FGC channels + game category browse
            const vods: TwitchVod[] = [];
            const seen = new Set<string>();

            const channels = FGC_CHANNELS[gameId] || [];
            for (const channel of channels) {
                try {
                    const channelVods = await this.getChannelVods(channel, 3);
                    for (const v of channelVods) {
                        if (!seen.has(v.id)) { seen.add(v.id); vods.push(v); }
                    }
                } catch (e: any) {
                    Logger.warn(`[TwitchDiscovery] Channel ${channel} fetch failed: ${e.message}`);
                }
            }

            try {
                const gameVods = await this.getGameVods(twitchGameId, 10);
                for (const v of gameVods) {
                    if (!seen.has(v.id)) { seen.add(v.id); vods.push(v); }
                }
            } catch (e: any) {
                errors.push(`${gameId} game browse: ${e.message}`);
            }

            for (const vod of vods) {
                try {
                    const vodUrl = vod.url; // e.g. https://www.twitch.tv/videos/123456789

                    // Use youtube_url field as generic video_url (unique index deduplication)
                    const existing = await IngestionJob.findOne({ youtube_url: vodUrl }).lean();
                    if (existing) { skipped++; continue; }

                    const jobId = UuidHelper.generate();
                    await IngestionJob.create({
                        job_id: jobId,
                        game_id: gameId,
                        youtube_url: vodUrl,
                        video_title: vod.title,
                        channel_name: vod.user_name,
                        search_query: `twitch:${gameId}`,
                        source: 'twitch',
                        video_platform: 'twitch',
                        status: 'pending',
                        retry_count: 0,
                    });

                    await queueService.addAnalysisJob({
                        job_id: jobId,
                        game_id: gameId,
                        youtube_url: vodUrl,
                        video_title: vod.title,
                        video_platform: 'twitch',
                        source: 'ingestion',
                    });

                    queued++;
                    Logger.info(`[TwitchDiscovery] Queued: ${vod.title} (${vod.user_name})`);
                } catch {
                    skipped++;
                }
            }
        }

        Logger.info(`[TwitchDiscovery] Done: ${queued} queued, ${skipped} skipped`);
        return { queued, skipped, errors };
    }

    /**
     * Start a recurring scheduler that discovers Twitch VODs every N hours.
     */
    startScheduler(intervalMs = 6 * 60 * 60 * 1000): void {
        if (!this.isConfigured) return;

        Logger.info('[TwitchDiscovery] Scheduler started (every 6h)');
        this.discoverAndQueue().catch(e => Logger.error('[TwitchDiscovery] Initial run failed:', e));

        setInterval(() => {
            this.discoverAndQueue().catch(e => Logger.error('[TwitchDiscovery] Scheduled run failed:', e));
        }, intervalMs);
    }
}
