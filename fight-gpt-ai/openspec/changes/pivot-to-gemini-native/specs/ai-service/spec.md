## MODIFIED Requirements

### Requirement: Video Analysis Request Handling
The system SHALL accept analysis jobs via `POST /analyze` and respond with structured coaching insights using Gemini's native video understanding.

#### Scenario: Valid analysis request (cache hit)
- **WHEN** a request body with `youtube_url` or `video_path` maps to a cached result
- **THEN** the response status SHALL be 200
- **AND** the response SHALL include `"status": "success"` and `"source": "cache"`
- **AND** the response SHALL return the cached analysis in Pro Coach JSON schema format

#### Scenario: Valid analysis request (new analysis with YouTube URL)
- **WHEN** a request body with `youtube_url` does not map to a cached result
- **THEN** the system SHALL download the source video using `yt-dlp`
- **AND** the system SHALL upload the video to Google Generative AI File API using `genai.upload_file`
- **AND** the system SHALL poll for file state until it reaches `ACTIVE`
- **AND** the system SHALL call `model.generate_content` with the video file and Pro Coach prompt
- **AND** the system SHALL parse the JSON response with strict schema validation
- **AND** the system SHALL persist the generated analysis to MongoDB before responding
- **AND** the system SHALL delete the uploaded file from Gemini File API using `genai.delete_file`
- **AND** the response status SHALL be 200 with `"source": "new_analysis"` and structured analysis in Pro Coach format

#### Scenario: Valid analysis request (new analysis with local video file)
- **WHEN** a request body with `video_path` points to a valid local video file
- **AND** the file does not map to a cached result
- **THEN** the system SHALL upload the video to Google Generative AI File API using `genai.upload_file`
- **AND** the system SHALL poll for file state until it reaches `ACTIVE`
- **AND** the system SHALL call `model.generate_content` with the video file and Pro Coach prompt
- **AND** the system SHALL parse the JSON response with strict schema validation
- **AND** the system SHALL persist the generated analysis to MongoDB before responding
- **AND** the system SHALL delete the uploaded file from Gemini File API using `genai.delete_file`
- **AND** the response status SHALL be 200 with structured analysis in Pro Coach format

#### Scenario: Invalid input rejected
- **WHEN** the request body omits both `youtube_url` and `video_path`
- **OR** the request includes an invalid URL or non-existent file path
- **THEN** the system SHALL return status 400
- **AND** the response body SHALL include a descriptive `detail` message

#### Scenario: Gemini API failure handled gracefully
- **WHEN** video upload to Gemini File API fails (network error, quota exceeded, invalid key)
- **OR** file processing fails or times out
- **OR** JSON parsing fails due to invalid response format
- **THEN** the system SHALL return status 500
- **AND** the response body SHALL include `detail` with the failure reason
- **AND** the system SHALL clean up any uploaded files if possible

### Requirement: Analysis Event Schema
The system SHALL emit analysis events conforming to the Pro Coach JSON schema for downstream consumers.

#### Scenario: Pro Coach JSON schema response
- **WHEN** an analysis completes successfully
- **THEN** the response SHALL conform to the following schema:
  - `game_title` (string): Identified fighting game (e.g., "Street Fighter 6", "Tekken 8")
  - `p1_character` (string): Player 1 character name
  - `p2_character` (string): Player 2 character name
  - `match_winner` (string): "p1" or "p2"
  - `timeline` (array): Array of analysis events with:
    - `timestamp` (string): "MM:SS" format
    - `event_type` (string): One of "punish_missed", "bad_habit", "pro_move", "neutral_loss"
    - `description` (string): Short explanation of what happened
    - `coach_advice` (string): Specific tip to fix it
  - `top_3_tips` (array of strings): Top three coaching recommendations
  - `daily_mission` (object): Training drill with:
    - `title` (string): Mission name
    - `drill_steps` (array of strings): Step-by-step instructions
    - `goal` (string): What the drill accomplishes

### Requirement: Gemini-Native Processing Pipeline
The system SHALL implement a pipeline that uses Gemini's native video understanding to generate coaching insights, replacing frame-by-frame computer vision processing.

#### Scenario: Pipeline execution order
- **WHEN** a new analysis runs
- **THEN** the system SHALL execute steps in the following sequence:
  1. Download video asset via `yt-dlp` (if YouTube URL) or locate local file (if video_path)
  2. Upload video file to Gemini File API using `genai.upload_file`
  3. Poll file state until status is `ACTIVE` (with timeout and retry logic)
  4. Generate content using `model.generate_content` with:
     - Model: `gemini-1.5-flash` or `gemini-2.0-flash`
     - Video file from step 2
     - Pro Coach system prompt from `coach_system_prompt.txt`
     - Generation config with `response_mime_type="application/json"`
  5. Parse and validate JSON response against Pro Coach schema
  6. Persist to MongoDB cache
  7. Delete uploaded file from Gemini File API using `genai.delete_file`
  8. Clean up local video file
- **AND** failures in any step SHALL abort the remaining steps and emit appropriate error response
- **AND** frame-by-frame pose tracking with MediaPipe and OpenCV SHALL NOT be performed

### Requirement: Gemini File API Integration
The system SHALL use Google Generative AI File API for video upload and management.

#### Scenario: Video file upload and state management
- **WHEN** a video file is ready for analysis
- **THEN** the system SHALL upload it using `genai.upload_file(file_path)`
- **AND** the system SHALL poll the file state using `file.state` property
- **AND** the system SHALL wait until state is `ACTIVE` before proceeding
- **AND** the system SHALL implement timeout (e.g., 5 minutes) and retry logic
- **AND** if state becomes `FAILED`, the system SHALL return an error

#### Scenario: File cleanup after processing
- **WHEN** analysis completes (successfully or with error)
- **THEN** the system SHALL delete the uploaded file using `genai.delete_file(file.name)`
- **AND** the system SHALL handle cleanup errors gracefully (log warning, continue)

## REMOVED Requirements

### Requirement: Analysis Event Schema (Old Format)
**Reason**: Replaced with Pro Coach JSON schema that provides richer coaching insights.
**Migration**: Downstream consumers must update to use new schema with `timeline`, `top_3_tips`, and `daily_mission` fields. The old schema with `frame`, `timestamp_sec`, `player_1_state`, `player_2_state`, `detected_event`, and `event_player` is no longer used.

## ADDED Requirements

### Requirement: Gemini Native Video Analysis
The system SHALL use Gemini's multimodal video understanding capabilities for gameplay analysis.

#### Scenario: Gemini video upload and analysis
- **WHEN** a video file is available for analysis
- **THEN** the system SHALL upload it to Gemini File API
- **AND** the system SHALL use `gemini-1.5-flash` or `gemini-2.0-flash` model
- **AND** the system SHALL configure generation with strict JSON mode
- **AND** the system SHALL parse the response as valid JSON conforming to Pro Coach schema
- **AND** the system SHALL return structured coaching insights including game identification, character recognition, timeline analysis, and daily missions

### Requirement: Pro Coach System Prompt
The system SHALL use the "Sensei GPT" Pro Coach prompt for generating coaching insights.

#### Scenario: Prompt configuration
- **WHEN** generating analysis content
- **THEN** the system SHALL use the prompt from `coach_system_prompt.txt`
- **AND** the prompt SHALL instruct Gemini to act as "Sensei GPT," an elite Fighting Game Coach
- **AND** the prompt SHALL require JSON output matching the Pro Coach schema
- **AND** the prompt SHALL focus on identifying: frame traps, missed punishes, neutral game mistakes, bad habits, and pro moves

### Requirement: Operational Environment
The system SHALL run as a Dockerized service without heavy media processing dependencies.

#### Scenario: Containerized deployment
- **WHEN** the service image builds
- **THEN** it SHALL install Python 3.10+, FastAPI, Uvicorn, and project dependencies
- **AND** dependencies SHALL include: `google-generativeai`, `yt-dlp`, `pymongo`, `beautifulsoup4`, `requests`, `python-dotenv`
- **AND** dependencies SHALL NOT include: `mediapipe`, `opencv-python-headless`
- **AND** the container SHALL NOT require OpenCV or MediaPipe system libraries
- **AND** the container entrypoint SHALL launch Uvicorn on port 8000

