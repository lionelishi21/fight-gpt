# Testing Gemini Integration

## Quick Start Testing

### Step 1: Start Docker Services

```bash
# Build and start the services (this will install google-generativeai)
docker-compose up --build
```

You should see in the logs:
- `✅ Gemini API configured successfully` - if the API key is working
- `⚠️  Gemini configuration error: ...` - if there's an issue

### Step 2: Test the API

In another terminal, test the health endpoint:

```bash
curl http://localhost:8000/
```

Expected response:
```json
{"message": "Fight GPT AI Coach API is running!"}
```

### Step 3: Test Video Analysis with Gemini

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"}'
```

**Expected Response (with Gemini enabled):**
```json
{
  "status": "success",
  "analysis": [
    "Frame 0: Player state is STANDING",
    "Frame 30: Player state is CROUCHING"
  ],
  "gemini_analysis": {
    "gemini_analysis": "Detailed strategic insights from Gemini...",
    "model": "gemini-1.5-pro"
  },
  "cached": false
}
```

### Step 4: Check Logs

Watch the Docker logs to see Gemini in action:

```bash
docker-compose logs -f fight-gpt-api
```

You should see:
- `Running Gemini semantic analysis...`
- `✅ Gemini analysis completed`

## Troubleshooting

### Gemini Not Working?

1. **Check API Key**: Verify your key is in `docker-compose.yml` or set as environment variable
2. **Check Logs**: Look for error messages in `docker-compose logs fight-gpt-api`
3. **Verify Package**: The `google-generativeai` package should be installed in the container
4. **Test API Key**: Visit https://makersuite.google.com/app/apikey to verify your key is active

### Common Issues

- **"google-generativeai not installed"**: The package should install automatically when building the Docker image
- **"Gemini API call failed"**: Check your API key is valid and has quota remaining
- **No gemini_analysis in response**: Check logs for errors, API key might be invalid

## Testing Both Grok and Gemini

If you have both API keys set, you'll get analysis from both:

```json
{
  "status": "success",
  "analysis": [...],
  "grok_analysis": {...},
  "gemini_analysis": {...}
}
```

