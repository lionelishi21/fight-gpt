# YouTube Cookies Setup Guide

This guide will help you export cookies from your browser to bypass YouTube's bot detection.

## Step 1: Export Cookies from Browser

### Option A: Chrome/Edge (Recommended)

1. **Install the Extension:**
   - Go to: https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
   - Click "Add to Chrome"

2. **Export Cookies:**
   - Go to YouTube.com and make sure you're **logged in**
   - Click the extension icon in your browser toolbar
   - Click "Export" button
   - Save the file as `cookies.txt` in this project directory (`/Users/Ish/software-development/fight-gpt-ai/`)

### Option B: Firefox

1. **Install the Extension:**
   - Go to: https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/
   - Click "Add to Firefox"

2. **Export Cookies:**
   - Go to YouTube.com and make sure you're **logged in**
   - Click the extension icon → "Export"
   - Save as `cookies.txt` in the project directory

### Option C: Manual Export (Advanced)

If extensions don't work, you can use browser developer tools:
1. Open YouTube.com (logged in)
2. Open Developer Tools (F12)
3. Go to Application/Storage tab → Cookies
4. Copy all cookies and format as Netscape cookie format
5. Save as `cookies.txt`

## Step 2: Verify Cookie File

Make sure `cookies.txt` is in the project root:
```bash
ls -lh cookies.txt
```

The file should contain lines like:
```
.youtube.com	TRUE	/	TRUE	1234567890	VISITOR_INFO1_LIVE	abc123...
```

## Step 3: Restart Docker Services

```bash
docker-compose restart fight-gpt-api
```

## Step 4: Test

Try analyzing a video:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"}'
```

## Troubleshooting

### Cookies Not Working?

1. **Check file exists:**
   ```bash
   docker-compose exec fight-gpt-api ls -la /app/cookies.txt
   ```

2. **Check logs for cookie usage:**
   ```bash
   docker-compose logs fight-gpt-api | grep -i cookie
   ```
   You should see: `🍪 Using cookies for authentication...`

3. **Re-export cookies:**
   - Make sure you're logged into YouTube
   - Export fresh cookies
   - Restart the service

### File Permissions

If you get permission errors:
```bash
chmod 644 cookies.txt
```

## Security Note

- `cookies.txt` contains your YouTube session cookies
- Keep it private - don't commit to git (already in .gitignore)
- Cookies expire after some time - you may need to re-export periodically









