# YouTube Cookies Setup (Workaround for Bot Detection)

If YouTube is blocking video downloads with "Sign in to confirm you're not a bot", you can use cookies from your browser to bypass this.

## Quick Setup

### Step 1: Export Cookies from Browser

**Chrome/Edge:**
1. Install the "Get cookies.txt LOCALLY" extension: https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
2. Go to YouTube and make sure you're logged in
3. Click the extension icon
4. Click "Export" to download `cookies.txt`

**Firefox:**
1. Install "cookies.txt" extension: https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/
2. Go to YouTube and make sure you're logged in
3. Click the extension icon → Export

### Step 2: Add Cookies to Docker

**Option A: Mount cookies file**
Add to `docker-compose.yml`:
```yaml
services:
  fight-gpt-api:
    volumes:
      - ./cookies.txt:/app/cookies.txt:ro
    environment:
      - YOUTUBE_COOKIES_FILE=/app/cookies.txt
```

**Option B: Copy into container**
```bash
docker cp cookies.txt fight-gpt-coach:/app/cookies.txt
docker-compose restart fight-gpt-api
```

### Step 3: Set Environment Variable

In `docker-compose.yml`, add:
```yaml
environment:
  - YOUTUBE_COOKIES_FILE=/app/cookies.txt
```

## Alternative: Update yt-dlp

Sometimes updating yt-dlp helps:
```bash
docker-compose exec fight-gpt-api pip install --upgrade yt-dlp
docker-compose restart fight-gpt-api
```

## Testing

After setting up cookies, test with:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"}'
```

The system will automatically use cookies if the file exists and is configured.

