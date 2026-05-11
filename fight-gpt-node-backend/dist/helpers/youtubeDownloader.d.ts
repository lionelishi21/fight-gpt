import { Storage } from '@google-cloud/storage';
/**
 * Streams a YouTube video directly to Google Cloud Storage.
 * This avoids downloading the video to the local disk, saving memory and disk space.
 */
export declare function streamYoutubeToGcs(youtubeUrl: string, storage: Storage, bucketName: string, fileName: string): Promise<string>;
//# sourceMappingURL=youtubeDownloader.d.ts.map