## ADDED Requirements

### Requirement: Optional Semantic Video Analysis with Grok
The system SHALL support optional semantic video analysis using Grok (xAI's multimodal LLM) to provide higher-level strategic insights, character recognition, and natural language coaching recommendations that complement MediaPipe pose tracking.

#### Scenario: Grok analysis enabled and successful
- **WHEN** `GROK_API_KEY` environment variable is set
- **AND** a video analysis request is processed
- **THEN** the system SHALL extract key frames from the video
- **AND** the system SHALL send key frames and MediaPipe results to Grok API
- **AND** the system SHALL include `grok_analysis` object in the response with semantic insights
- **AND** the response SHALL include both MediaPipe analysis and Grok analysis

#### Scenario: Grok analysis gracefully degrades when unavailable
- **WHEN** `GROK_API_KEY` environment variable is not set
- **AND** a video analysis request is processed
- **THEN** the system SHALL proceed with MediaPipe analysis only
- **AND** the response SHALL NOT include `grok_analysis` field
- **AND** the system SHALL continue to function normally without errors

#### Scenario: Grok API failure handled gracefully
- **WHEN** `GROK_API_KEY` is set
- **AND** Grok API call fails (network error, invalid key, rate limit, etc.)
- **THEN** the system SHALL log a warning message
- **AND** the system SHALL continue with MediaPipe analysis only
- **AND** the response SHALL NOT include `grok_analysis` field
- **AND** the system SHALL NOT return an error to the client

### Requirement: Key Frame Extraction for Semantic Analysis
The system SHALL extract representative key frames from videos for efficient semantic analysis by external LLM services.

#### Scenario: Key frames extracted from video
- **WHEN** Grok analysis is enabled
- **AND** a video is processed
- **THEN** the system SHALL extract 5 evenly distributed key frames from the video
- **AND** each frame SHALL be encoded as base64 JPEG format
- **AND** frames SHALL be selected at evenly spaced intervals throughout the video duration

## MODIFIED Requirements

### Requirement: Video Analysis Request Handling
The system SHALL accept analysis jobs via `POST /analyze` and respond with normalized event data, optionally enhanced with semantic analysis from Grok.

#### Scenario: Valid analysis request (cache hit)
- **WHEN** a request body with `youtube_url` and `game_id` maps to a cached result
- **THEN** the response status SHALL be 200
- **AND** the response SHALL include `"status": "success"` and `"source": "cache"`
- **AND** the response SHALL return the cached `analysis` array and a stable `analysis_id`
- **AND** if the cached result includes `grok_analysis`, it SHALL be returned in the response

#### Scenario: Valid analysis request (new analysis)
- **WHEN** a request body with `youtube_url` and `game_id` does not map to a cached result
- **THEN** the system SHALL download the source video using `yt-dlp`
- **AND** the system SHALL analyze frames with OpenCV and MediaPipe detection modules
- **AND** if `GROK_API_KEY` is configured, the system SHALL perform semantic analysis with Grok
- **AND** the system SHALL persist the generated analysis (including Grok results if available) to MongoDB before responding
- **AND** the response status SHALL be 200 with `"source": "new_analysis"` and a populated `analysis` array
- **AND** if Grok analysis was performed, the response SHALL include `grok_analysis` object

### Requirement: Caching Strategy
The system SHALL prevent redundant processing by caching results keyed by video source, including optional Grok analysis results.

#### Scenario: Cache population
- **WHEN** a new analysis completes
- **THEN** the system SHALL persist the analysis document with fields `youtube_url`, `game_id`, `analysis_id`, and `analysis`
- **AND** if Grok analysis was performed, the system SHALL include `grok_analysis` in the cached document
- **AND** subsequent identical requests SHALL be served from the cache with all cached data including Grok results










