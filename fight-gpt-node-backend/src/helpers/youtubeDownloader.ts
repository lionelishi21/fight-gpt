import ytdl from '@distube/ytdl-core';
import { Storage } from '@google-cloud/storage';
import { Logger } from './logger';

/**
 * Streams a YouTube video directly to Google Cloud Storage.
 * This avoids downloading the video to the local disk, saving memory and disk space.
 */
export async function streamYoutubeToGcs(
  youtubeUrl: string,
  storage: Storage,
  bucketName: string,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    Logger.info(`[YoutubeDownloader] Starting stream for ${youtubeUrl} to gs://${bucketName}/${fileName}`);
    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(fileName);

      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'video/mp4',
        },
        // We use non-resumable uploads for direct piping from a stream to avoid chunking errors
        resumable: false, 
      });

      // Fetch the video. We use the default behavior (highest quality audio+video format, usually 720p)
      // which is perfect for AI analysis without being too large.
      const videoStream = ytdl(youtubeUrl, { 
        filter: 'audioandvideo'
      });

      videoStream.pipe(writeStream);

      writeStream.on('finish', () => {
        Logger.info(`[YoutubeDownloader] Successfully streamed ${youtubeUrl} to GCS`);
        resolve(`gs://${bucketName}/${fileName}`);
      });

      writeStream.on('error', (err) => {
        Logger.error(`[YoutubeDownloader] GCS WriteStream error:`, err);
        reject(err);
      });

      videoStream.on('error', (err) => {
        Logger.error(`[YoutubeDownloader] YouTube Stream error:`, err);
        reject(err);
      });

    } catch (err) {
        Logger.error(`[YoutubeDownloader] Setup error:`, err);
        reject(err);
    }
  });
}
