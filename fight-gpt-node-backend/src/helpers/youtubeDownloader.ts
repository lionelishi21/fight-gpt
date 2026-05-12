import { chromium } from 'playwright';
import { Storage } from '@google-cloud/storage';
import { Logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class YoutubeBotBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YoutubeBotBlockError';
  }
}

/**
 * Streams a YouTube video to GCS by recording it in a real Chromium browser session.
 * This completely bypasses YouTube bot detection by using a real browser engine
 * that naturally executes JavaScript challenges and appears as a genuine user.
 *
 * Trade-off: Recording is real-time (a 10-min video takes ~10 min to capture).
 */
export async function streamYoutubeToGcs(
  youtubeUrl: string,
  storage: Storage,
  bucketName: string,
  fileName: string
): Promise<string> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'metapunish-'));
  const recordingPath = path.join(tempDir, 'recording.webm');

  Logger.info(`[YoutubeDownloader] Launching Playwright for ${youtubeUrl}`);
  Logger.info(`[YoutubeDownloader] Recording to temp dir: ${tempDir}`);

  // Set a 90-minute hard timeout (catches even very long matches)
  const TIMEOUT_MS = 90 * 60 * 1000;
  let browser: any = null;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Playwright recording timed out after 90 minutes')), TIMEOUT_MS)
  );

  const recordingPromise = (async () => {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--autoplay-policy=no-user-gesture-required',
      ],
    });

    const context = await browser.newContext({
      recordVideo: {
        dir: tempDir,
        size: { width: 1280, height: 720 },
      },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    const page = await context.newPage();

    // Hide automation fingerprints
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    Logger.info(`[YoutubeDownloader] Navigating to ${youtubeUrl}`);
    await page.goto(youtubeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Dismiss cookie/consent dialogs if present
    try {
      const consentBtn = page.locator('button:has-text("Accept all"), button:has-text("I agree"), button:has-text("Accept")').first();
      if (await consentBtn.isVisible({ timeout: 5000 })) {
        await consentBtn.click();
        Logger.info('[YoutubeDownloader] Dismissed consent dialog');
      }
    } catch { /* No consent dialog, continue */ }

    // Wait for the video element to be present
    await page.waitForSelector('video', { timeout: 30000 });

    // Inject CSS to maximize the video and hide all YouTube UI chrome
    await page.addStyleTag({
      content: `
        #masthead, #secondary, #comments, ytd-watch-metadata,
        .ytp-chrome-top, .ytp-chrome-bottom, #chat, 
        ytd-companion-slot-renderer, ytd-merch-shelf-renderer { display: none !important; }
        video { position: fixed !important; top: 0 !important; left: 0 !important;
                width: 100vw !important; height: 100vh !important; z-index: 9999 !important;
                background: #000 !important; }
      `,
    });

    // Force autoplay and skip ads
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.muted = false;
        video.play().catch(() => {});
      }
    });

    // Skip any ad that appears
    try {
      const skipBtn = page.locator('.ytp-skip-ad-button, .ytp-ad-skip-button').first();
      if (await skipBtn.isVisible({ timeout: 8000 })) {
        await skipBtn.click();
        Logger.info('[YoutubeDownloader] Skipped ad');
      }
    } catch { /* No ad, continue */ }

    // Get the video duration so we know how long to wait
    const durationSec: number = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video?.duration || 0;
    });

    Logger.info(`[YoutubeDownloader] Video duration: ${Math.round(durationSec)}s — waiting for playback to complete`);

    if (durationSec <= 0) {
      throw new YoutubeBotBlockError('Could not detect video duration. The video may be private, deleted, or geo-restricted.');
    }

    // Wait for the video to finish playing (duration + 10s buffer)
    const waitMs = Math.min((durationSec + 10) * 1000, TIMEOUT_MS);
    await page.evaluate((ms: number) => {
      return new Promise<void>((resolve) => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (!video || video.ended) { resolve(); return; }
        const timeout = setTimeout(resolve, ms);
        video.addEventListener('ended', () => { clearTimeout(timeout); resolve(); });
      });
    }, waitMs);

    Logger.info('[YoutubeDownloader] Playback complete — finalizing recording');

    // Close context to flush the .webm recording to disk
    await context.close();
    await browser.close();
    browser = null;

    // Playwright names the recording by page. Find the .webm file in tempDir.
    const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
    if (files.length === 0) {
      throw new Error('Playwright did not produce a recording file.');
    }

    const actualRecordingPath = path.join(tempDir, files[0]);
    Logger.info(`[YoutubeDownloader] Recording saved to ${actualRecordingPath} — uploading to GCS`);

    // Upload the .webm to GCS
    const gcsFileName = fileName.replace('.mp4', '.webm');
    await storage.bucket(bucketName).upload(actualRecordingPath, {
      destination: gcsFileName,
      metadata: { contentType: 'video/webm' },
    });

    const gcsUri = `gs://${bucketName}/${gcsFileName}`;
    Logger.info(`[YoutubeDownloader] Successfully uploaded to ${gcsUri}`);

    // Cleanup temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch { /* best-effort cleanup */ }

    return gcsUri;
  })();

  try {
    return await Promise.race([recordingPromise, timeoutPromise]);
  } catch (err: any) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    // Cleanup temp files on error
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    throw err;
  }
}
