# Capability: ai-service

The Python AI Analysis Service powers Fight GPT’s game intelligence pipeline. It ingests video sources, performs computer-vision analysis, consults cached data, and emits structured events that downstream systems interpret as coaching insights.

## Purpose

- Provide a deterministic contract for video analysis results consumed by the Node.js gateway and client applications.
- Orchestrate high-cost media processing tasks behind a containerized FastAPI interface.
- Maintain a cache of analysis artifacts in MongoDB to prevent redundant computation.

## Requirements

### Requirement: Service Health Reporting
The system SHALL expose a `GET /` endpoint that confirms service availability and build metadata.

#### Scenario: Service responds healthy
- **WHEN** a caller issues `GET /`
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL include `{ "message": "Fight GPT AI Coach API is running!" }`

### Requirement: Video Analysis Request Handling
The system SHALL accept analysis jobs via `POST /analyze` and respond with normalized event data.

#### Scenario: Valid analysis request (cache hit)
- **WHEN** a request body with `youtube_url` and `game_id` maps to a cached result
- **THEN** the response status SHALL be 200
- **AND** the response SHALL include `"status": "success"` and `"source": "cache"`
- **AND** the response SHALL return the cached `analysis` array and a stable `analysis_id`

#### Scenario: Valid analysis request (new analysis)
- **WHEN** a request body with `youtube_url` and `game_id` does not map to a cached result
- **THEN** the system SHALL download the source video using `yt-dlp`
- **AND** the system SHALL analyze frames with OpenCV and MediaPipe detection modules
- **AND** the system SHALL persist the generated analysis to MongoDB before responding
- **AND** the response status SHALL be 200 with `"source": "new_analysis"` and a populated `analysis` array

#### Scenario: Invalid input rejected
- **WHEN** the request body omits a required property or includes an invalid `youtube_url`
- **THEN** the system SHALL return status 400
- **AND** the response body SHALL include a descriptive `detail` message

#### Scenario: Unhandled processing failure
- **WHEN** an unexpected error occurs during download or processing
- **THEN** the system SHALL return status 500
- **AND** the response body SHALL include `detail` with the failure reason

### Requirement: Analysis Event Schema
The system SHALL emit analysis events conforming to a documented schema for downstream consumers.

#### Scenario: Event payload shape
- **WHEN** an analysis completes successfully
- **THEN** each item in the `analysis` array SHALL include:
  - `frame` (integer frame identifier)
  - `timestamp_sec` (floating-point time offset)
  - `player_1_state` and `player_2_state` (enumerated posture labels)
  - `detected_event` (string describing the action, e.g., `"HADOKEN"`, `"MISSED_PUNISH"`)
  - `event_player` (integer referencing the participant responsible for the event)

### Requirement: Caching Strategy
The system SHALL prevent redundant processing by caching results keyed by video source.

#### Scenario: Cache lookup performed
- **WHEN** `POST /analyze` receives a request
- **THEN** the system SHALL query MongoDB collection `analysis_cache` using the canonicalized `youtube_url`
- **AND** the system SHALL return the cached analysis immediately if present

#### Scenario: Cache population
- **WHEN** a new analysis completes
- **THEN** the system SHALL persist the analysis document with fields `youtube_url`, `game_id`, `analysis_id`, and `analysis`
- **AND** subsequent identical requests SHALL be served from the cache

### Requirement: Processing Pipeline
The system SHALL implement a deterministic pipeline that transforms video frames into analysis events.

#### Scenario: Pipeline execution order
- **WHEN** a new analysis runs
- **THEN** the system SHALL execute steps in the following sequence:
  1. Download video asset via `yt-dlp`
  2. Decode frames with OpenCV
  3. Perform pose estimation with MediaPipe
  4. Perform HUD analysis (health bars, portraits) with OpenCV
  5. Apply pattern recognition functions (e.g., `detect_hadoken`, `detect_jump`, `detect_crouch`)
  6. Synthesize structured events
- **AND** failures in any step SHALL abort the remaining steps and emit a 500 response

### Requirement: Frame Data Ingestion
The system SHALL maintain normalized frame data for supported characters sourced from trusted wikis.

#### Scenario: Scraper execution
- **WHEN** the frame data scraper runs for a supported character
- **THEN** it SHALL fetch the latest frame data from the configured wiki endpoint
- **AND** it SHALL parse move metadata including name, startup, active, recovery, advantage, damage, and properties
- **AND** it SHALL upsert the record into MongoDB collection `frame_data` keyed by `{ game_id, character_id }`

#### Scenario: Scraper failure handling
- **WHEN** the scraper encounters an HTTP or parsing error
- **THEN** it SHALL log the failure reason
- **AND** it SHALL leave the previously stored frame data document untouched
- **AND** it SHALL exit with a non-zero status code so operational alerts can trigger

### Requirement: Operational Environment
The system SHALL run as a Dockerized service compatible with the Fight GPT infrastructure.

#### Scenario: Containerized deployment
- **WHEN** the service image builds
- **THEN** it SHALL install Python 3.10+, FastAPI, Uvicorn, and project dependencies (`mediapipe`, `opencv-python-headless`, `yt-dlp`, `pymongo`, `beautifulsoup4`, `requests`)
- **AND** the container entrypoint SHALL launch Uvicorn on port 8000


