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
    await page.goto(youtubeUrl, { waitUntil: 'load', timeout: 60000 });

    // Log page title to see what YouTube is actually showing
    const pageTitle = await page.title();
    Logger.info(`[YoutubeDownloader] Page title: "${pageTitle}"`);

    // Dismiss cookie/consent/sign-in dialogs if present — try multiple selectors
    const consentSelectors = [
      'button:has-text("Accept all")',
      'button:has-text("I agree")',
      'button:has-text("Accept")',
      '[aria-label="Accept all"]',
      'tp-yt-paper-button:has-text("AGREE")',
    ];
    for (const sel of consentSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click();
          Logger.info(`[YoutubeDownloader] Dismissed dialog via: ${sel}`);
          await page.waitForTimeout(1500);
          break;
        }
      } catch { /* continue */ }
    }

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

    // STEP 1: Wait for actual video playback to begin using readyState + videoWidth.
    // This is the real signal that frames are being decoded — not duration.
    Logger.info('[YoutubeDownloader] Waiting for video playback to start (readyState >= 2 + videoWidth > 0)...');
    const isPlaying: boolean = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const check = setInterval(() => {
          const video = document.querySelector('video') as HTMLVideoElement;
          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            clearInterval(check);
            resolve(true);
          }
        }, 500);
        // Give up after 45s — if still not playing, something is blocking it
        setTimeout(() => { clearInterval(check); resolve(false); }, 45000);
      });
    });

    if (!isPlaying) {
      // Take a diagnostic screenshot to see what YouTube is actually showing
      const screenshotPath = path.join(tempDir, 'debug-screenshot.png');
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const debugInfo = await page.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          videoSrc: (document.querySelector('video') as HTMLVideoElement)?.src?.substring(0, 100) || 'none',
          videoReadyState: (document.querySelector('video') as HTMLVideoElement)?.readyState ?? -1,
          videoWidth: (document.querySelector('video') as HTMLVideoElement)?.videoWidth ?? 0,
          bodyText: document.body?.innerText?.substring(0, 400),
        }));
        Logger.error(`[YoutubeDownloader] Video not playing. Debug: ${JSON.stringify(debugInfo)}`);
        Logger.info(`[YoutubeDownloader] Screenshot saved to: ${screenshotPath}`);
      } catch { Logger.warn('[YoutubeDownloader] Could not take debug screenshot'); }
      throw new YoutubeBotBlockError('Video did not start playing. YouTube may be showing a sign-in or consent wall. Check the debug screenshot.');
    }

    // STEP 2: Now that video is confirmed playing, read the duration (it will be valid now)
    const durationSec: number = await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video?.duration || 0;
    });
    Logger.info(`[YoutubeDownloader] Video is PLAYING ✓ | Duration: ${Math.round(durationSec)}s | Waiting for playback to finish...`);

    // STEP 3: Wait for the video to finish (ended event or duration+10s buffer fallback)
    const waitMs = durationSec > 0
      ? Math.min((durationSec + 10) * 1000, TIMEOUT_MS)
      : TIMEOUT_MS;

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
