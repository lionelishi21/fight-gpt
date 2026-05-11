"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamYoutubeToGcs = streamYoutubeToGcs;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
/**
 * Streams a YouTube video directly to Google Cloud Storage using yt-dlp.
 * This avoids downloading the video to the local disk, saving memory and disk space.
 * yt-dlp is more robust than ytdl-core for bypassing YouTube scraping protections.
 */
async function streamYoutubeToGcs(youtubeUrl, storage, bucketName, fileName) {
    return new Promise((resolve, reject) => {
        logger_1.Logger.info(`[YoutubeDownloader] Starting yt-dlp stream for ${youtubeUrl} to gs://${bucketName}/${fileName}`);
        try {
            const bucket = storage.bucket(bucketName);
            const file = bucket.file(fileName);
            const writeStream = file.createWriteStream({
                metadata: {
                    contentType: 'video/mp4',
                },
                resumable: false,
            });
            // We use yt-dlp to fetch the video and output to stdout (-)
            // We request a format that is compatible with MP4 and reasonably sized (720p or lower)
            const ytDlpArgs = [
                '-f', 'best[height<=720][ext=mp4]/best[ext=mp4]/best',
                '-o', '-',
            ];
            // Use cookies if provided in environment to bypass bot protections
            if (process.env.YTDL_COOKIES_FILE) {
                ytDlpArgs.push('--cookies', process.env.YTDL_COOKIES_FILE);
            }
            else {
                // Fallback: try to use the android client which sometimes bypasses basic bot checks
                ytDlpArgs.push('--extractor-args', 'youtube:player_client=android');
            }
            ytDlpArgs.push(youtubeUrl);
            const ytDlp = (0, child_process_1.spawn)('yt-dlp', ytDlpArgs);
            ytDlp.stdout.pipe(writeStream);
            // Log stderr for debugging purposes
            ytDlp.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    logger_1.Logger.debug(`[yt-dlp stderr] ${message}`);
                }
            });
            writeStream.on('finish', () => {
                logger_1.Logger.info(`[YoutubeDownloader] Successfully streamed ${youtubeUrl} to GCS`);
                resolve(`gs://${bucketName}/${fileName}`);
            });
            writeStream.on('error', (err) => {
                logger_1.Logger.error(`[YoutubeDownloader] GCS WriteStream error:`, err);
                ytDlp.kill();
                reject(err);
            });
            ytDlp.on('error', (err) => {
                logger_1.Logger.error(`[YoutubeDownloader] yt-dlp process error:`, err);
                reject(err);
            });
            ytDlp.on('close', (code) => {
                if (code !== 0 && code !== null) {
                    logger_1.Logger.error(`[YoutubeDownloader] yt-dlp exited with code ${code}`);
                    reject(new Error(`yt-dlp exited with code ${code}`));
                }
            });
        }
        catch (err) {
            logger_1.Logger.error(`[YoutubeDownloader] Setup error:`, err);
            reject(err);
        }
    });
}
//# sourceMappingURL=youtubeDownloader.js.map