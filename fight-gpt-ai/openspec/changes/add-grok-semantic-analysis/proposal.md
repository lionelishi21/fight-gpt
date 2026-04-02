## Why

The current video analysis pipeline uses MediaPipe for precise pose tracking and frame-by-frame detection, which provides excellent technical accuracy but lacks semantic understanding of gameplay context. Adding Grok (xAI's multimodal LLM) as an optional enhancement layer will enable the system to provide higher-level strategic insights, character recognition, move identification, and natural language coaching recommendations that complement the existing computer vision analysis.

## What Changes

- Add optional Grok API integration for semantic video analysis
- Extract key frames from videos for Grok processing
- Combine MediaPipe pose tracking results with Grok's semantic insights
- Add environment variable configuration for Grok API key
- Include Grok analysis results in API response when available
- Gracefully degrade when Grok API key is not configured (non-breaking)

## Impact

- Affected specs: `ai-service`
- Affected code: `api.py` (added Grok integration functions and enhanced `/analyze` endpoint)
- Breaking changes: None (Grok is optional and gracefully degrades)
- Dependencies: No new Python dependencies required (uses existing `requests` library)










