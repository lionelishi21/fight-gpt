"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeBotBlockError = void 0;
exports.streamYoutubeToGcs = streamYoutubeToGcs;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class YoutubeBotBlockError extends Error {
    constructor(message) {
        super(message);
        this.name = 'YoutubeBotBlockError';
    }
}
exports.YoutubeBotBlockError = YoutubeBotBlockError;
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
            // Use cookies if provided in environment or fallback to uploads/cookies.txt
            const defaultCookiePath = path_1.default.resolve(process.cwd(), 'uploads/cookies.txt');
            const cookiePath = process.env.YTDL_COOKIES_FILE || defaultCookiePath;
            if (fs_1.default.existsSync(cookiePath)) {
                ytDlpArgs.push('--cookies', cookiePath);
            }
            else {
                // Fallback: try to use the android client which sometimes bypasses basic bot checks
                ytDlpArgs.push('--extractor-args', 'youtube:player_client=android');
            }
            ytDlpArgs.push(youtubeUrl);
            let stderrOutput = '';
            const ytDlpPath = '/usr/local/bin/yt-dlp';
            // Fallback to 'yt-dlp' if absolute path doesn't exist (for local dev)
            const command = fs_1.default.existsSync(ytDlpPath) ? ytDlpPath : 'yt-dlp';
            const ytDlp = (0, child_process_1.spawn)(command, ytDlpArgs);
            // Set a 10-minute timeout for the download process
            const timeoutMinutes = 10;
            const timeout = setTimeout(() => {
                logger_1.Logger.error(`[YoutubeDownloader] yt-dlp timed out after ${timeoutMinutes} minutes for ${youtubeUrl}`);
                ytDlp.kill('SIGKILL');
                reject(new Error(`Download timed out after ${timeoutMinutes} minutes`));
            }, timeoutMinutes * 60 * 1000);
            ytDlp.stdout.pipe(writeStream);
            // Log stderr for debugging purposes and collect for error checking
            ytDlp.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    stderrOutput += message + '\n';
                    logger_1.Logger.debug(`[yt-dlp stderr] ${message}`);
                }
            });
            writeStream.on('finish', () => {
                clearTimeout(timeout);
                logger_1.Logger.info(`[YoutubeDownloader] Successfully streamed ${youtubeUrl} to GCS`);
                resolve(`gs://${bucketName}/${fileName}`);
            });
            writeStream.on('error', (err) => {
                clearTimeout(timeout);
                logger_1.Logger.error(`[YoutubeDownloader] GCS WriteStream error:`, err);
                ytDlp.kill();
                reject(err);
            });
            ytDlp.on('error', (err) => {
                clearTimeout(timeout);
                logger_1.Logger.error(`[YoutubeDownloader] yt-dlp process error:`, err);
                reject(err);
            });
            ytDlp.on('close', (code) => {
                clearTimeout(timeout);
                if (code !== 0 && code !== null) {
                    logger_1.Logger.error(`[YoutubeDownloader] yt-dlp exited with code ${code}`);
                    if (stderrOutput.includes('Sign in to confirm you’re not a bot') || stderrOutput.includes('The following content is not available on this app')) {
                        reject(new YoutubeBotBlockError('YouTube blocked the request. The cookies.txt file may be missing, expired, or invalid.'));
                    }
                    else {
                        reject(new Error(`yt-dlp exited with code ${code}: ${stderrOutput.split('\n').pop()}`));
                    }
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