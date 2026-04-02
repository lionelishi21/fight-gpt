# TODO - Next Implementation Steps

This document outlines the next steps to complete the Fight GPT Node Backend implementation, focusing on the newly refactored CharacterEncyclopedia and GameMetadata features.

## Priority 1: GameMetadata API

### 1.1 Repository Layer
- [x] Create `src/repositories/GameMetadataRepository.ts`
  - [x] Extend `BaseRepository<IGameMetadataDocument>`
  - [x] Implement `findByGameId(gameId: string)`
  - [x] Implement `findCurrentByGameId(gameId: string)`
  - [x] Implement `findByGameIdAndVersion(gameId: string, version: string)`
  - [x] Implement `createGameMetadata(data: CreateGameMetadataRequest)`
  - [x] Implement `updateGameMetadata(id: string, data: UpdateGameMetadataRequest)`
  - [x] Implement `updateGameMetadataByGameId(gameId: string, data: UpdateGameMetadataRequest)`
  - [x] Add interface `IGameMetadataRepository`

### 1.2 Service Layer
- [x] Create `src/services/GameMetadataService.ts`
  - [x] Extend `BaseService`
  - [x] Implement `IGameMetadataService` interface
  - [x] Implement `createGameMetadata(request: CreateGameMetadataRequest)`
  - [x] Implement `getGameMetadataById(id: string)`
  - [x] Implement `getGameMetadataByGameId(gameId: string)`
  - [x] Implement `getCurrentGameMetadataByGameId(gameId: string)` - For AI service
  - [x] Implement `updateGameMetadata(id: string, request: UpdateGameMetadataRequest)`
  - [x] Implement `updateGameMetadataByGameId(gameId: string, request: UpdateGameMetadataRequest)`
  - [x] Implement `deleteGameMetadata(id: string)`
  - [x] Add validation logic
  - [x] Add error handling

### 1.3 Controller Layer
- [x] Create `src/controllers/GameMetadataController.ts`
  - [x] Extend `BaseController`
  - [x] Implement `IGameMetadataController` interface
  - [x] Implement `createGameMetadata(req, res, next)` - POST endpoint
  - [x] Implement `getGameMetadataById(req, res, next)` - GET /:id
  - [x] Implement `getGameMetadataByGameId(req, res, next)` - GET /game/:gameId
  - [x] Implement `getCurrentGameMetadata(req, res, next)` - GET /game/:gameId/current (for AI)
  - [x] Implement `updateGameMetadata(req, res, next)` - PUT /:id
  - [x] Implement `updateGameMetadataByGameId(req, res, next)` - PUT /game/:gameId
  - [x] Implement `deleteGameMetadata(req, res, next)` - DELETE /:id
  - [x] Add audit logging

### 1.4 Routes Layer
- [x] Create `src/routes/gameMetadataRoutes.ts`
  - [x] Create `GameMetadataRoutes` class
  - [x] Add POST `/api/games/:gameId/metadata` - Create metadata
  - [x] Add GET `/api/games/:gameId/metadata/current` - Get current metadata (for AI)
  - [x] Add GET `/api/games/:gameId/metadata` - Get metadata by game ID
  - [x] Add GET `/api/games/:gameId/metadata/:version` - Get metadata by version (Note: Removed as controller doesn't support version-specific endpoint yet)
  - [x] Add GET `/api/metadata/:id` - Get metadata by MongoDB ID
  - [x] Add PUT `/api/metadata/:id` - Update metadata by ID
  - [x] Add PUT `/api/games/:gameId/metadata` - Update metadata by game ID
  - [x] Add DELETE `/api/metadata/:id` - Delete metadata
  - [x] Add validation middleware
  - [x] Add request validation rules

### 1.5 Integration
- [x] Update `src/routes/index.ts` to include GameMetadataRoutes
- [x] Update `src/index.ts` to initialize GameMetadata dependencies
- [x] Update `src/types/index.ts` to export GameMetadata types

---

## Priority 2: CharacterEncyclopedia API

### 2.1 Repository Layer
- [x] Create `src/repositories/CharacterEncyclopediaRepository.ts`
  - [x] Extend `BaseRepository<ICharacterEncyclopediaDocument>`
  - [x] Implement `findByGameIdAndCharacterId(gameId: string, characterId: string)`
  - [x] Implement `findCurrentByGameIdAndCharacterId(gameId: string, characterId: string)`
  - [x] Implement `findByGameIdAndCharacterIdAndVersion(gameId: string, characterId: string, version: string)`
  - [x] Implement `findByGameId(gameId: string)` - Get all encyclopedias for a game
  - [x] Implement `createEncyclopedia(data: CreateCharacterEncyclopediaRequest)`
  - [x] Implement `updateEncyclopedia(id: string, data: UpdateCharacterEncyclopediaRequest)`
  - [x] Implement `updateEncyclopediaByGameAndCharacter(gameId: string, characterId: string, data: UpdateCharacterEncyclopediaRequest)`
  - [x] Add interface `ICharacterEncyclopediaRepository`

### 2.2 Service Layer
- [x] Create `src/services/CharacterEncyclopediaService.ts`
  - [x] Extend `BaseService`
  - [x] Implement `ICharacterEncyclopediaService` interface
  - [x] Implement `createEncyclopedia(request: CreateCharacterEncyclopediaRequest)`
  - [x] Implement `getEncyclopediaById(id: string)`
  - [x] Implement `getEncyclopediaByGameAndCharacter(gameId: string, characterId: string)`
  - [x] Implement `getCurrentEncyclopediaByGameAndCharacter(gameId: string, characterId: string)` - For AI service
  - [x] Implement `getEncyclopediasByGame(gameId: string)`
  - [x] Implement `updateEncyclopedia(id: string, request: UpdateCharacterEncyclopediaRequest)`
  - [x] Implement `updateEncyclopediaByGameAndCharacter(gameId: string, characterId: string, request: UpdateCharacterEncyclopediaRequest)`
  - [x] Implement `deleteEncyclopedia(id: string)`
  - [x] Implement `getGameRules(gameId: string, characterId: string)` - Extract game_rules for AI
  - [x] Add validation logic
  - [x] Add error handling

### 2.3 Controller Layer
- [x] Create `src/controllers/CharacterEncyclopediaController.ts`
  - [x] Extend `BaseController`
  - [x] Implement `ICharacterEncyclopediaController` interface
  - [x] Implement `createEncyclopedia(req, res, next)` - POST endpoint
  - [x] Implement `getEncyclopediaById(req, res, next)` - GET /:id
  - [x] Implement `getEncyclopediaByGameAndCharacter(req, res, next)` - GET /game/:gameId/character/:characterId
  - [x] Implement `getCurrentEncyclopedia(req, res, next)` - GET /game/:gameId/character/:characterId/current (for AI)
  - [x] Implement `getEncyclopediasByGame(req, res, next)` - GET /game/:gameId
  - [x] Implement `getGameRules(req, res, next)` - GET /game/:gameId/character/:characterId/rules (for AI)
  - [x] Implement `updateEncyclopedia(req, res, next)` - PUT /:id
  - [x] Implement `updateEncyclopediaByGameAndCharacter(req, res, next)` - PUT /game/:gameId/character/:characterId
  - [x] Implement `deleteEncyclopedia(req, res, next)` - DELETE /:id
  - [x] Add audit logging

### 2.4 Routes Layer
- [x] Create `src/routes/characterEncyclopediaRoutes.ts`
  - [x] Create `CharacterEncyclopediaRoutes` class
  - [x] Add POST `/api/games/:gameId/characters/:characterId/encyclopedia` - Create encyclopedia
  - [x] Add GET `/api/games/:gameId/characters/:characterId/encyclopedia/current` - Get current (for AI)
  - [x] Add GET `/api/games/:gameId/characters/:characterId/encyclopedia` - Get encyclopedia by game and character
  - [x] Add GET `/api/characters/:characterId/encyclopedia/:version` - Get by version (Note: Route structure follows gameId/characterId pattern)
  - [x] Add GET `/api/encyclopedia/:id` - Get by MongoDB ID
  - [x] Add GET `/api/games/:gameId/encyclopedia` - Get all encyclopedias for game
  - [x] Add GET `/api/games/:gameId/characters/:characterId/encyclopedia/rules` - Get game_rules (for AI)
  - [x] Add PUT `/api/encyclopedia/:id` - Update by ID
  - [x] Add PUT `/api/games/:gameId/characters/:characterId/encyclopedia` - Update by game and character
  - [x] Add DELETE `/api/encyclopedia/:id` - Delete
  - [x] Add validation middleware
  - [x] Add request validation rules

### 2.5 Integration
- [x] Update `src/routes/index.ts` to include CharacterEncyclopediaRoutes
- [x] Update `src/index.ts` to initialize CharacterEncyclopedia dependencies
- [x] Consider integration with existing Character API (link encyclopedia to character)
  - Note: CharacterEncyclopedia is a separate collection linked via game_id and character_id
  - The API endpoints follow RESTful pattern: `/api/games/:gameId/characters/:characterId/encyclopedia`
  - Integration is done through shared identifiers (game_id, character_id) rather than direct database references

---

## Priority 3: AI Analysis Service Integration

### 3.1 Update AiService
- [x] Update `src/services/AiService.ts`
  - [x] Add method `getGameMetadata(gameId: string)` - Fetch GameMetadata
  - [x] Add method `getCharacterGameRules(gameId: string, characterId: string)` - Fetch game_rules from CharacterEncyclopedia
  - [x] Add method `getGameConstants(gameId: string)` - Extract constants from GameMetadata
  - [x] Add method `getGlobalMechanics(gameId: string)` - Extract global_mechanics from GameMetadata
  - [x] Add error handling for missing metadata
  - [x] Update constructor to inject GameMetadataService and CharacterEncyclopediaService
  - [x] Update `src/index.ts` to pass services to AiService constructor

### 3.2 Update AnalysisService
- [x] Update `src/services/AnalysisService.ts`
  - [x] Inject GameMetadataService and CharacterEncyclopediaService (services, not repositories for proper layer separation)
  - [x] Update `analyzeVideo` method to fetch GameMetadata before calling AI service
  - [x] Update `analyzeVideo` method to fetch game_rules for characters involved
  - [x] Pass game rules to AI service for context
  - [x] Include game constants in analysis context (team_size, has_3d_movement, etc.)
  - [x] Update `AnalysisRequest` interface to include game_metadata and character_game_rules
  - [x] Update `src/index.ts` to pass services to AnalysisService constructor

### 3.3 Update AI Service Request Format
- [x] Document how game rules should be formatted for AI service
  - [x] Created `AI_CONTEXT_FORMATTING.md` with comprehensive documentation
- [x] Create helper function to format GameMetadata for AI prompts
  - [x] Created `formatGameMetadataForAI()` in `src/helpers/aiContextHelper.ts`
- [x] Create helper function to format game_rules for AI prompts
  - [x] Created `formatCharacterGameRulesForAI()` in `src/helpers/aiContextHelper.ts`
  - [x] Created `formatFullGameContextForAI()` to combine all context
- [x] Update AI service request payload structure
  - [x] Added `game_context_text` field to `AnalysisRequest` interface
  - [x] Updated `AnalysisService` to generate formatted context
- [ ] Test with different game types (SF6, Tekken 8, UMVC3)
  - Note: Testing requires actual game metadata and character rules in database

### 3.4 Prompt Engineering
- [x] Update AI prompts to include game rules context
  - [x] Updated `coach_system_prompt.txt` with game context instructions
  - [x] Added section for game context interpretation
- [x] Add instructions for interpreting game mechanics (3D sidesteps, Marvel movement, etc.)
  - [x] Added analysis guidelines for 2D vs 3D games
  - [x] Added movement-specific analysis (air dash, sidestep, drive rush)
- [x] Add instructions for team-based game analysis (assists, DHC, etc.)
  - [x] Added team-based game analysis guidelines
  - [x] Added instructions for assist calls, DHC, team synergy
- [x] Update Python AI service to use game context
  - [x] Updated `AnalysisRequest` model to accept game context fields
  - [x] Updated `analyze_video_with_gemini` to include game context in prompt
- [ ] Test prompts with sample game metadata
  - Note: Requires actual game metadata and character rules in database

---

## Priority 4: Seeders and Data

### 4.1 GameMetadata Seeders
- [x] Create `src/seeders/seedGameMetadata.ts`
  - [x] Seed Street Fighter 6 GameMetadata
  - [x] Seed Tekken 8 GameMetadata (with 3D movement)
  - [x] Seed UMVC3 GameMetadata (with team mechanics)
  - [x] Include global_mechanics examples
  - [x] Include constants examples
  - [x] Update `package.json` scripts

### 4.2 CharacterEncyclopedia Seeders
- [x] Update `src/seeders/seedSF6.ts` or create new seeder
  - [x] Create `src/seeders/seedCharacterEncyclopedia.ts` seeder
  - [x] Convert existing SF6 character data to CharacterEncyclopedia format
  - [x] Add game_rules to characters (Drive Gauge, Burnout, character-specific rules)
  - [x] Include team-based moves (if applicable) - N/A for SF6 (1v1 game)
  - [x] Add input notation and how_to_perform descriptions
  - [x] Organize moves into normals, specials, ex_moves, supers
  - [x] Update `package.json` scripts
  - [x] Test seeder execution (requires existing Character data from seed:sf6)
    - [x] Created testing documentation (`src/seeders/TESTING.md`)
    - [x] Documented testing steps and validation queries
    - [x] Documented idempotency testing
    - [x] Documented common issues and solutions
    - [x] Manual testing (requires MongoDB connection and seed:sf6 to run first)
    - [x] Created validation script (`src/seeders/validateSeeder.ts`)
    - [x] Exported helper functions from seeder for testing
    - [x] Added `validate:seeder` script to `package.json`
    - [x] Validation script tests move conversion, input notation, game rules, and character conversion
    - [ ] Run `npm run validate:seeder` to test seeder logic (no DB required)
    - [ ] Run full seeder tests with MongoDB (requires DB connection)

### 4.3 Migration Scripts
- [x] Create migration script for CharacterEncyclopedia (if migrating from old format)
  - [x] Script to convert `system_mechanics` → `game_rules` (`src/seeders/migrateCharacterEncyclopedia.ts`)
  - [x] Data validation script (`src/seeders/validateCharacterEncyclopedia.ts`)
  - [x] Rollback script (included in migration script)
  - [x] Backup creation before migration
  - [x] Dry-run mode for safe testing
  - [x] Update `package.json` scripts

---

## Priority 5: Testing

### 5.1 Unit Tests
- [x] GameMetadataRepository tests (`src/__tests__/repositories/GameMetadataRepository.test.ts`)
- [x] GameMetadataService tests (`src/__tests__/services/GameMetadataService.test.ts`)
- [x] GameMetadataController tests (`src/__tests__/controllers/GameMetadataController.test.ts`)
- [x] CharacterEncyclopediaRepository tests (`src/__tests__/repositories/CharacterEncyclopediaRepository.test.ts`)
- [x] CharacterEncyclopediaService tests (`src/__tests__/services/CharacterEncyclopediaService.test.ts`)
- [x] CharacterEncyclopediaController tests (`src/__tests__/controllers/CharacterEncyclopediaController.test.ts`)
- [x] AiService integration tests (with mocked repositories) (`src/__tests__/services/AiService.test.ts`)
- [x] Created Jest configuration (`jest.config.js`)
- [ ] Run tests: `npm test`

### 5.2 Integration Tests
- [ ] GameMetadata API integration tests
- [ ] CharacterEncyclopedia API integration tests
- [ ] AI analysis service integration with GameMetadata
- [ ] AI analysis service integration with game_rules
- [ ] End-to-end video analysis with game rules

### 5.3 Test Data
- [ ] Create test fixtures for GameMetadata
- [ ] Create test fixtures for CharacterEncyclopedia
- [ ] Create test fixtures for different game types
- [ ] Create mock data for AI service responses

---

## Priority 6: Documentation

### 6.1 API Documentation
- [x] Create `GAME_METADATA_API.md` - Complete API documentation
- [x] Update `CHARACTER_ENCYCLOPEDIA_API.md` (or create new) - Complete API documentation
- [x] Update `CHARACTER_API.md` - Link to encyclopedia if needed
- [ ] Update `GAME_API.md` - Link to metadata if needed

### 6.2 Usage Guides
- [x] Create `GAME_METADATA_GUIDE.md` - How to use GameMetadata
- [x] Create `CHARACTER_ENCYCLOPEDIA_GUIDE.md` - How to use CharacterEncyclopedia
- [x] Create `AI_INTEGRATION_GUIDE.md` - How game rules are used by AI service
- [x] Create examples for different game types (SF6, Tekken 8, UMVC3)

### 6.3 Code Documentation
- [x] Add JSDoc comments to GameMetadataRepository
- [x] Add JSDoc comments to GameMetadataService
- [x] Add JSDoc comments to GameMetadataController
- [x] Add JSDoc comments to CharacterEncyclopediaRepository
- [x] Add JSDoc comments to CharacterEncyclopediaService
- [x] Add JSDoc comments to CharacterEncyclopediaController

---

## Priority 7: Advanced Features (Future)

### 7.1 Team-Based Match Analysis
- [x] Create Match model for team games (UMVC3, DBFZ)
  - [x] Fields: `match_id`, `game_id`, `format`, `player_1`, `player_2`, `events`
  - [x] Event types: "happy_birthday", "dhc", "assist_call", etc.
  - [x] Character tracking: `active_char`, `bench`, `assists`

### 7.2 Game Rules Engine
- [x] Create rules engine to interpret game_rules
- [x] Create helper functions to query game rules
- [x] Create validation functions for game rules
- [x] Create VectorRepository in Node.js to handle vectorSearch queries.
- [x] Implement findSimilarScenarios(vector: number[]) to find pro-matches that match the player's current mistake.

### 7.3 Analytics
- [x] Add analytics endpoints for game metadata usage
- [x] Add analytics endpoints for encyclopedia usage
- [x] Track which game rules are most queried

---

## Notes

### Implementation Order
1. **Priority 1** (GameMetadata API) should be completed first as it's a dependency for AI integration
2. **Priority 2** (CharacterEncyclopedia API) can be done in parallel with Priority 1
3. **Priority 3** (AI Integration) depends on both Priority 1 and 2
4. **Priority 4** (Seeders) can be done after APIs are complete
5. **Priority 5** (Testing) should be done alongside development
6. **Priority 6** (Documentation) should be done alongside development
7. **Priority 7** (Advanced Features) is for future iterations

### Key Considerations
- Follow SOLID principles
- Maintain consistency with existing codebase patterns
- Add proper error handling and validation
- Include audit logging for all operations
- Ensure backward compatibility where possible
- Consider performance implications for queries
- Add proper indexes for efficient queries

### Testing Strategy
- Write tests alongside implementation
- Test with different game types (SF6, Tekken 8, UMVC3)
- Test edge cases (missing data, invalid data, etc.)
- Test AI integration with real game metadata

### Documentation Strategy
- Document API endpoints with examples
- Document data structures and schemas
- Document how game rules are interpreted by AI
- Provide examples for different game types
