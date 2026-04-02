## Why

The current implementation uses MediaPipe for frame-by-frame pose tracking and OpenCV for video processing, which requires significant local compute resources and provides limited semantic understanding of gameplay. Pivoting to Gemini's native video understanding capabilities will provide superior coaching intelligence by leveraging multimodal AI that can understand fighting game context, character interactions, and strategic patterns without heavy local dependencies. This simplifies the architecture, reduces hardware requirements, and delivers more actionable coaching insights.

## What Changes

- **BREAKING**: Remove MediaPipe and OpenCV dependencies completely
- **BREAKING**: Remove frame-by-frame pose tracking pipeline
- Replace with Gemini 1.5/2.0 Flash Multimodal API for native video understanding
- Implement Google Generative AI SDK with File API for video upload
- Use structured JSON output from Gemini with strict schema enforcement
- Update response schema to match "Pro Coach" format with game analysis, timeline, and coaching missions
- Maintain yt-dlp for video downloads (still needed)
- Update Docker configuration to remove heavy media processing libraries

## Impact

- Affected specs: `ai-service` (major refactor)
- Affected code: `api.py` (complete rewrite of analysis pipeline), `requirements.txt`, `Dockerfile`
- Breaking changes: Yes - API response schema changes, MediaPipe analysis removed
- Dependencies: Remove `mediapipe`, `opencv-python-headless`; Keep `google-generativeai`, `yt-dlp`

