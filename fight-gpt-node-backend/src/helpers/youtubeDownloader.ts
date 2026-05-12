import { spawn } from 'child_process';
import { Storage } from '@google-cloud/storage';
import { Logger } from './logger';
import fs from 'fs';
import path from 'path';

export class YoutubeBotBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YoutubeBotBlockError';
  }
}

/**
 * Streams a YouTube video directly to Google Cloud Storage using yt-dlp.
 * This avoids downloading the video to the local disk, saving memory and disk space.
 * yt-dlp is more robust than ytdl-core for bypassing YouTube scraping protections.
 */
export async function streamYoutubeToGcs(
  youtubeUrl: string,
  storage: Storage,
  bucketName: string,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    Logger.info(`[YoutubeDownloader] Starting yt-dlp stream for ${youtubeUrl} to gs://${bucketName}/${fileName}`);
    
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
      const defaultCookiePath = path.resolve(process.cwd(), 'uploads/cookies.txt');
      const cookiePath = process.env.YTDL_COOKIES_FILE || defaultCookiePath;

      if (fs.existsSync(cookiePath)) {
        Logger.info(`[YoutubeDownloader] Using cookies found at: ${cookiePath}`);
        ytDlpArgs.push('--cookies', cookiePath);
      } else {
        Logger.warn(`[YoutubeDownloader] No cookies.txt found at ${cookiePath}. Falling back to android client.`);
        // Fallback: try to use the android client which sometimes bypasses basic bot checks
        ytDlpArgs.push('--extractor-args', 'youtube:player_client=android');
      }

      ytDlpArgs.push('--no-check-certificates');
      ytDlpArgs.push('--prefer-free-formats');
      ytDlpArgs.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      ytDlpArgs.push('--add-header', 'Accept-Language: en-US,en;q=0.9');
      ytDlpArgs.push('--add-header', 'Sec-Fetch-Mode: navigate');

      ytDlpArgs.push(youtubeUrl);
      
      let stderrOutput = '';
      const ytDlpPath = '/usr/local/bin/yt-dlp';
      const command = fs.existsSync(ytDlpPath) ? ytDlpPath : 'yt-dlp';
      
      const ytDlp = spawn(command, ytDlpArgs);

      // Log the command (masking cookies for safety)
      const maskedArgs = ytDlpArgs.map(arg => arg.includes('cookies.txt') ? 'REDACTED_COOKIES' : arg);
      Logger.info(`[YoutubeDownloader] Executing: ${command} ${maskedArgs.join(' ')}`);

      // Set a 10-minute timeout for the download process
      const timeoutMinutes = 10;
      const timeout = setTimeout(() => {
        Logger.error(`[YoutubeDownloader] yt-dlp timed out after ${timeoutMinutes} minutes for ${youtubeUrl}`);
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
          Logger.debug(`[yt-dlp stderr] ${message}`);
        }
      });

      writeStream.on('finish', () => {
        clearTimeout(timeout);
        Logger.info(`[YoutubeDownloader] Successfully streamed ${youtubeUrl} to GCS`);
        resolve(`gs://${bucketName}/${fileName}`);
      });

      writeStream.on('error', (err) => {
        clearTimeout(timeout);
        Logger.error(`[YoutubeDownloader] GCS WriteStream error:`, err);
        ytDlp.kill();
        reject(err);
      });

      ytDlp.on('error', (err) => {
        clearTimeout(timeout);
        Logger.error(`[YoutubeDownloader] yt-dlp process error:`, err);
        reject(err);
      });

      ytDlp.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && code !== null) {
          Logger.error(`[YoutubeDownloader] yt-dlp failed with code ${code}. Full Error: ${stderrOutput}`);
          
          if (stderrOutput.includes('Sign in to confirm you’re not a bot') || stderrOutput.includes('The following content is not available on this app')) {
            reject(new YoutubeBotBlockError('YouTube blocked the request. The cookies.txt file may be missing, expired, or invalid. Try exporting fresh cookies.'));
          } else {
            reject(new Error(`yt-dlp failed: ${stderrOutput.split('\n').filter(l => l.startsWith('ERROR')).join(' ') || stderrOutput.split('\n').pop()}`));
          }
        }
      });

    } catch (err) {
        Logger.error(`[YoutubeDownloader] Setup error:`, err);
        reject(err);
    }
  });
}
