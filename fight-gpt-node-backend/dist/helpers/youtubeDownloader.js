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
            // We relax the format to 'best' to ensure we get something regardless of challenges
            const ytDlpArgs = [
                '-f', 'best',
                '--no-playlist',
                '--ignore-config',
                '-o', '-',
            ];
            // Use TV and iOS clients which often skip the n-challenge puzzles
            ytDlpArgs.push('--extractor-args', 'youtube:player_client=tv,ios');
            // TEMPORARY: Disable cookies to force yt-dlp to use TV/iOS clients.
            // This bypasses the 'web' client requirement for JavaScript puzzle solving.
            /*
            if (fs.existsSync(cookiePath)) {
              Logger.info(`[YoutubeDownloader] Using cookies found at: ${cookiePath}`);
              ytDlpArgs.push('--cookies', cookiePath);
            } else {
              Logger.warn(`[YoutubeDownloader] No cookies.txt found at ${cookiePath}. Falling back to android client.`);
              // Fallback: try to use the android client which sometimes bypasses basic bot checks
              ytDlpArgs.push('--extractor-args', 'youtube:player_client=android');
            }
            */
            ytDlpArgs.push('--no-check-certificates');
            ytDlpArgs.push('--prefer-free-formats');
            ytDlpArgs.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
            ytDlpArgs.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
            ytDlpArgs.push('--add-header', 'Sec-Fetch-Mode: navigate');
            ytDlpArgs.push(youtubeUrl);
            let stderrOutput = '';
            const ytDlpPath = '/usr/local/bin/yt-dlp';
            const command = fs_1.default.existsSync(ytDlpPath) ? ytDlpPath : 'yt-dlp';
            const ytDlp = (0, child_process_1.spawn)(command, ytDlpArgs);
            // Log the command (masking cookies for safety)
            const maskedArgs = ytDlpArgs.map(arg => arg.includes('cookies.txt') ? 'REDACTED_COOKIES' : arg);
            logger_1.Logger.info(`[YoutubeDownloader] Executing: ${command} ${maskedArgs.join(' ')}`);
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
                    // We only log to debug to keep worker-out.log clean, 
                    // but we will show full stderr on failure.
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
                    logger_1.Logger.error(`[YoutubeDownloader] yt-dlp failed with code ${code}. Full Error: ${stderrOutput}`);
                    if (stderrOutput.includes('Sign in to confirm you’re not a bot') || stderrOutput.includes('The following content is not available on this app')) {
                        reject(new YoutubeBotBlockError('YouTube blocked the request. The cookies.txt file may be missing, expired, or invalid. Try exporting fresh cookies.'));
                    }
                    else {
                        reject(new Error(`yt-dlp failed: ${stderrOutput.split('\n').filter(l => l.startsWith('ERROR')).join(' ') || stderrOutput.split('\n').pop()}`));
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