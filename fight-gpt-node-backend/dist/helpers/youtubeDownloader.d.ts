import { Storage } from '@google-cloud/storage';
export declare class YoutubeBotBlockError extends Error {
    constructor(message: string);
}
/**
 * Streams a YouTube video to GCS by recording it in a real Chromium browser session.
 * This completely bypasses YouTube bot detection by using a real browser engine
 * that naturally executes JavaScript challenges and appears as a genuine user.
 *
 * Trade-off: Recording is real-time (a 10-min video takes ~10 min to capture).
 */
export declare function streamYoutubeToGcs(youtubeUrl: string, storage: Storage, bucketName: string, fileName: string): Promise<string>;
//# sourceMappingURL=youtubeDownloader.d.ts.map