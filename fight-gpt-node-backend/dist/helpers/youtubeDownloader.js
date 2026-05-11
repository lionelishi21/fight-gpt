"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamYoutubeToGcs = streamYoutubeToGcs;
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const logger_1 = require("./logger");
/**
 * Streams a YouTube video directly to Google Cloud Storage.
 * This avoids downloading the video to the local disk, saving memory and disk space.
 */
async function streamYoutubeToGcs(youtubeUrl, storage, bucketName, fileName) {
    return new Promise((resolve, reject) => {
        logger_1.Logger.info(`[YoutubeDownloader] Starting stream for ${youtubeUrl} to gs://${bucketName}/${fileName}`);
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
            const videoStream = (0, ytdl_core_1.default)(youtubeUrl, {
                filter: 'audioandvideo'
            });
            videoStream.pipe(writeStream);
            writeStream.on('finish', () => {
                logger_1.Logger.info(`[YoutubeDownloader] Successfully streamed ${youtubeUrl} to GCS`);
                resolve(`gs://${bucketName}/${fileName}`);
            });
            writeStream.on('error', (err) => {
                logger_1.Logger.error(`[YoutubeDownloader] GCS WriteStream error:`, err);
                reject(err);
            });
            videoStream.on('error', (err) => {
                logger_1.Logger.error(`[YoutubeDownloader] YouTube Stream error:`, err);
                reject(err);
            });
        }
        catch (err) {
            logger_1.Logger.error(`[YoutubeDownloader] Setup error:`, err);
            reject(err);
        }
    });
}
//# sourceMappingURL=youtubeDownloader.js.map