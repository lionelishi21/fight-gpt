## ADDED Requirements

### Requirement: Optional Semantic Video Analysis with Gemini
The system SHALL support optional semantic video analysis using Google's Gemini API to provide higher-level strategic insights, character recognition, and natural language coaching recommendations that complement MediaPipe pose tracking.

#### Scenario: Gemini analysis enabled and successful
- **WHEN** `GEMINI_API_KEY` environment variable is set
- **AND** a video analysis request is processed
- **THEN** the system SHALL extract key frames from the video
- **AND** the system SHALL send key frames and MediaPipe results to Gemini API
- **AND** the system SHALL include `gemini_analysis` object in the response with semantic insights
- **AND** the response SHALL include both MediaPipe analysis and Gemini analysis

#### Scenario: Gemini analysis gracefully degrades when unavailable
- **WHEN** `GEMINI_API_KEY` environment variable is not set
- **AND** a video analysis request is processed
- **THEN** the system SHALL proceed with MediaPipe analysis only (or with Grok if enabled)
- **AND** the response SHALL NOT include `gemini_analysis` field
- **AND** the system SHALL continue to function normally without errors

#### Scenario: Gemini API failure handled gracefully
- **WHEN** `GEMINI_API_KEY` is set
- **AND** Gemini API call fails (network error, invalid key, rate limit, etc.)
- **THEN** the system SHALL log a warning message
- **AND** the system SHALL continue with MediaPipe analysis only (or with Grok if enabled)
- **AND** the response SHALL NOT include `gemini_analysis` field
- **AND** the system SHALL NOT return an error to the client

#### Scenario: Both Grok and Gemini can be enabled simultaneously
- **WHEN** both `GROK_API_KEY` and `GEMINI_API_KEY` environment variables are set
- **AND** a video analysis request is processed
- **THEN** the system SHALL perform semantic analysis with both services
- **AND** the response SHALL include both `grok_analysis` and `gemini_analysis` objects
- **AND** both analyses SHALL be cached together in MongoDB

## MODIFIED Requirements

### Requirement: Video Analysis Request Handling
The system SHALL accept analysis jobs via `POST /analyze` and respond with normalized event data, optionally enhanced with semantic analysis from Grok and/or Gemini.

#### Scenario: Valid analysis request (cache hit)
- **WHEN** a request body with `youtube_url` and `game_id` maps to a cached result
- **THEN** the response status SHALL be 200
- **AND** the response SHALL include `"status": "success"` and `"source": "cache"`
- **AND** the response SHALL return the cached `analysis` array and a stable `analysis_id`
- **AND** if the cached result includes `grok_analysis` or `gemini_analysis`, they SHALL be returned in the response

#### Scenario: Valid analysis request (new analysis)
- **WHEN** a request body with `youtube_url` and `game_id` does not map to a cached result
- **THEN** the system SHALL download the source video using `yt-dlp`
- **AND** the system SHALL analyze frames with OpenCV and MediaPipe detection modules
- **AND** if `GROK_API_KEY` is configured, the system SHALL perform semantic analysis with Grok
- **AND** if `GEMINI_API_KEY` is configured, the system SHALL perform semantic analysis with Gemini
- **AND** the system SHALL persist the generated analysis (including Grok and/or Gemini results if available) to MongoDB before responding
- **AND** the response status SHALL be 200 with `"source": "new_analysis"` and a populated `analysis` array
- **AND** if Grok analysis was performed, the response SHALL include `grok_analysis` object
- **AND** if Gemini analysis was performed, the response SHALL include `gemini_analysis` object

### Requirement: Caching Strategy
The system SHALL prevent redundant processing by caching results keyed by video source, including optional Grok and Gemini analysis results.

#### Scenario: Cache population
- **WHEN** a new analysis completes
- **THEN** the system SHALL persist the analysis document with fields `youtube_url`, `game_id`, `analysis_id`, and `analysis`
- **AND** if Grok analysis was performed, the system SHALL include `grok_analysis` in the cached document
- **AND** if Gemini analysis was performed, the system SHALL include `gemini_analysis` in the cached document
- **AND** subsequent identical requests SHALL be served from the cache with all cached data including semantic analysis results

### Requirement: Optional Semantic Video Analysis with Grok
The system SHALL support optional semantic video analysis using Grok (xAI's multimodal LLM) to provide higher-level strategic insights, character recognition, and natural language coaching recommendations that complement MediaPipe pose tracking.

#### Scenario: Grok analysis enabled and successful
- **WHEN** `GROK_API_KEY` environment variable is set
- **AND** a video analysis request is processed
- **THEN** the system SHALL extract key frames from the video
- **AND** the system SHALL send key frames and MediaPipe results to Grok API
- **AND** the system SHALL include `grok_analysis` object in the response with semantic insights
- **AND** the response SHALL include both MediaPipe analysis and Grok analysis
- **AND** Gemini analysis (if enabled) SHALL also be performed independently


