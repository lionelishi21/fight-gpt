import { Storage } from '@google-cloud/storage';
export declare class YoutubeBotBlockError extends Error {
    constructor(message: string);
}
/**
 * Streams a YouTube video directly to Google Cloud Storage using yt-dlp.
 * This avoids downloading the video to the local disk, saving memory and disk space.
 * yt-dlp is more robust than ytdl-core for bypassing YouTube scraping protections.
 */
export declare function streamYoutubeToGcs(youtubeUrl: string, storage: Storage, bucketName: string, fileName: string): Promise<string>;
//# sourceMappingURL=youtubeDownloader.d.ts.map