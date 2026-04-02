## 1. Dependency Changes
- [x] 1.1 Remove mediapipe from requirements.txt
- [x] 1.2 Remove opencv-python-headless from requirements.txt
- [x] 1.3 Verify google-generativeai is present (already added)
- [x] 1.4 Add python-dotenv if not present
- [x] 1.5 Update Dockerfile to remove OpenCV/MediaPipe system dependencies

## 2. Code Refactoring
- [x] 2.1 Remove MediaPipe initialization and pose detection code
- [x] 2.2 Remove OpenCV frame processing functions (process_video_to_json, extract_key_frames)
- [x] 2.3 Remove run_coach_analysis function (frame-by-frame analysis)
- [x] 2.4 Remove analyze_with_grok function (removed, no longer needed)
- [x] 2.5 Remove analyze_with_gemini function (key frames approach - replaced with File API)
- [x] 2.6 Implement new Gemini File API upload function (upload_video_to_gemini)
- [x] 2.7 Implement polling loop for file state ACTIVE
- [x] 2.8 Implement genai.generate_content with video file (analyze_video_with_gemini)
- [x] 2.9 Configure strict JSON mode (response_mime_type="application/json")
- [x] 2.10 Implement Pro Coach prompt from coach_system_prompt.txt
- [x] 2.11 Add error handling for Google API upload/generation

## 3. API Response Schema
- [x] 3.1 Update AnalysisRequest model to support new schema (supports youtube_url and video_path)
- [x] 3.2 Update response to match Pro Coach JSON schema:
  - game_title, p1_character, p2_character
  - match_winner, timeline, top_3_tips, daily_mission
- [x] 3.3 Update caching to store new schema format

## 4. Cleanup
- [x] 4.1 Remove unused helper functions (all MediaPipe/OpenCV functions removed)
- [x] 4.2 Clean up imports (removed cv2, mediapipe imports)
- [x] 4.3 Implement genai.delete_file after processing (cleanup_gemini_file function)
- [x] 4.4 Update cleanup to remove local video files (only for downloaded YouTube videos)

## 5. Testing
- [ ] 5.1 Test video upload to Gemini File API
- [ ] 5.2 Test polling for ACTIVE state
- [ ] 5.3 Test JSON response parsing
- [ ] 5.4 Test error handling
- [ ] 5.5 Test caching with new schema

## 6. Documentation
- [ ] 6.1 Update README with new architecture
- [ ] 6.2 Update API documentation
- [ ] 6.3 Document new response schema
- [x] 6.4 Update docker-compose environment variables (GOOGLE_API_KEY, GEMINI_MODEL)

