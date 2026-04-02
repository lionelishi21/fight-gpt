UPLOAD VIDEOS HERE FOR ANALYSIS
================================

Place your video files (.mp4, .avi, .mov, etc.) in this folder.

Then analyze them using the API:

Option 1: Using just the filename (if in uploads folder)
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"video_path": "your_video.mp4"}'

Option 2: Using full path
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"video_path": "/full/path/to/your_video.mp4"}'

The system will:
1. Process the video with MediaPipe (pose detection)
2. Analyze with Gemini (semantic insights)
3. Return comprehensive analysis results

Note: Videos are NOT deleted after analysis - they remain in this folder.
