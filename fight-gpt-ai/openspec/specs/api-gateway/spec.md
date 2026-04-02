# Capability: api-gateway

The Node.js API Gateway fronts Fight GPT’s platform services. It authenticates client requests, proxies analysis jobs to the Python AI service, normalizes responses, and manages persistence interactions with MongoDB.

## Purpose

- Provide a stable HTTP contract for web and mobile clients.
- Enforce request validation, rate protection, and future authentication layers.
- Coordinate calls between clients, the AI analysis service, and MongoDB caches.

## Requirements

### Requirement: Service Health Endpoint
The system SHALL expose `GET /api/health` to confirm gateway availability.

#### Scenario: Health check succeeds
- **WHEN** a caller issues `GET /api/health`
- **THEN** the response status SHALL be 200
- **AND** the response body SHALL include `{ "status": "ok", "service": "fight-gpt-api" }`

### Requirement: Analysis Request Intake
The system SHALL accept analysis requests via `POST /api/analyze` with JSON payload.

#### Scenario: Valid request accepted
- **WHEN** the request body includes `youtube_url` and `game_id`
- **THEN** the gateway SHALL persist an audit record with the request metadata
- **AND** the gateway SHALL forward the payload to the AI service `/analyze` endpoint
- **AND** the response status SHALL be 202 with `{ "analysis_id": "...", "status": "pending" }` if the AI service runs asynchronously
- **OR** the response status SHALL be 200 with the AI service result if executed synchronously

#### Scenario: Invalid payload rejected
- **WHEN** required fields are missing or malformed
- **THEN** the gateway SHALL return status 400 with `{ "error": "Invalid request payload" }`

### Requirement: AI Service Integration
The system SHALL broker communication with the AI analysis service with resilience.

#### Scenario: Successful AI service call
- **WHEN** the AI service responds with 200 and analysis data
- **THEN** the gateway SHALL return status 200 to the client
- **AND** the gateway SHALL include `source`, `analysis_id`, and `analysis` in the response body

#### Scenario: AI service unavailable
- **WHEN** the AI service responds with an error or is unreachable
- **THEN** the gateway SHALL return status 502 with `{ "error": "AI service unavailable" }`
- **AND** the gateway SHALL log the failure for observability

### Requirement: MongoDB Caching Coordination
The system SHALL manage cache reads and writes around AI service calls.

#### Scenario: Cache lookup before forwarding
- **WHEN** `POST /api/analyze` receives a request
- **THEN** the gateway SHALL query MongoDB `analysis_cache` for an existing result keyed by `youtube_url`
- **AND** if found, the gateway SHALL return status 200 with `"source": "cache"` and bypass the AI service call

#### Scenario: Cache population after analysis
- **WHEN** the AI service returns a new analysis
- **THEN** the gateway SHALL persist the response document in MongoDB for future cache hits

### Requirement: Logging and Metrics
The system SHALL emit structured logs and basic metrics for observability.

#### Scenario: Request logging
- **WHEN** the gateway processes any `/api/analyze` request
- **THEN** it SHALL log the request ID, source IP, youtube_url hash, and response status

#### Scenario: Metrics emission
- **WHEN** requests succeed or fail
- **THEN** the gateway SHALL increment counters for `analyze.success`, `analyze.cache_hit`, and `analyze.error`

### Requirement: Operational Environment
The system SHALL run as an Express application behind Fight GPT’s container orchestration.

#### Scenario: Containerized deployment
- **WHEN** the gateway image builds
- **THEN** it SHALL install Node.js 20+, Express, Axios (or equivalent HTTP client), and MongoDB driver
- **AND** the container entrypoint SHALL start the Express server on port 5000
- **AND** service configuration (Mongo URI, AI service base URL, API keys) SHALL be read from environment variables

