# TODO — FightGPT Node Backend

**Last updated:** 2026-04-05  
**API live at:** `https://api.fightingames.online/api`

---

## ✅ Completed

- [x] Game CRUD API (12 endpoints)
- [x] Character CRUD API (18 SF6 characters seeded)
- [x] CharacterEncyclopedia API
- [x] GameMetadata API
- [x] Video Analysis Pipeline (YouTube → Python AI → Node → MongoDB)
- [x] Vector Storage (Scenario embeddings via Gemini + Atlas)
- [x] SF6 Character Seeders
- [x] Audit Logging
- [x] Rate Limiting + Security (Helmet)
- [x] Auth (JWT via `x-auth-token` header — NOT Authorization: Bearer)
- [x] MetaService + MetaController + MetaRoutes
- [x] TheoryService + TheoryController + TheoryRoutes
- [x] IngestionService + IngestionController + IngestionRoutes
- [x] GamificationService (`GET /gamification/stats`)
- [x] TrainingService (`GET /training/missions`)
- [x] OnboardingController (`POST /onboarding/complete`)
- [x] ChatService (works without MongoDB, needs Gemini key only)

---

## 🔴 P0 — Blocking Core Product (Fix First)

### 1. Fix Ingestion Pipeline
**Problem:** `POST /ingestion/trigger {"game_id":"sf6"}` returns `queued_count: 0`. No videos are being queued.
**Check:** Does `.env` on the server have `YOUTUBE_API_KEY`? Does `IngestionService` have YouTube search queries configured for each game?
**Quick fix:** Manually insert 10 known SF6 tournament YouTube URLs into the `ingestionJobs` MongoDB collection, then call `POST /ingestion/process` to process them. This seeds the `scenarios` collection.
**Why critical:** Without scenarios → meta generation fails, theory generation fails, vector query fails.

### 2. Fix planType Not Returned from /auth/me
**Problem:** `GET /auth/me` returns User document, but `planType` lives on `UserGame` model. So `user.planType` is always `undefined`.
**Fix:** In `AuthController.getMe`, after fetching user, also query `UserGame.findOne({ user: userId, isActive: true })` and append `planType` to the user object in the response.
**Why critical:** Both web and mobile gate features on `user.planType === 'premium'`. Currently all users appear free.

### 3. Fix Gemini Embedding Quota Error on /meta/:gameId/query
**Problem:** Returns `[GoogleGenerativeAI Error]: Error fetching from .../text-embedding-004:embedContent`
**Check:** Verify `GEMINI_API_KEY` env var on server. Check quota in Google AI Studio / Cloud Console.

---

## 🟡 P1 — High Value

### 4. Correct API Route Mismatches (vs what frontend expects)

| Frontend/Mobile calls | Actual route | Fix |
|----------------------|-------------|-----|
| `GET /theory/:gameId` | `GET /theory/:gameId/characters` | Add alias or update all clients |
| `GET /onboarding/status` | Does not exist | Add GET /onboarding/status or remove from frontend |
| `GET /training/plan` | `GET /training/missions` | Rename route or add alias |

### 5. Add mainCharacter to /auth/me Response
Web dojo roster uses `user.preferences.mainCharacter` to determine locked characters. But the main character is stored in `UserGame.character`. Need to populate this on the `/me` response.

### 6. Seed Ingestion with Real Tournament URLs (after fix #1)
Once ingestion pipeline works, run a one-time seeder that queues 20–30 known SF6 tournament YouTube URLs. This populates the `scenarios` collection and enables meta + theory generation.

---

## 🟢 P2 — Nice to Have

### 7. Add Tekken 8 Characters
Only SF6 is seeded. Create a seeder similar to `sf6Seeder.ts` for Tekken 8.

### 8. Tournament Intelligence Feed
Auto-ingest EVO, Combo Breaker results. Add `Tournament` model + ingestion cronjob.

### 9. Esports Org B2B Tier
New `orgAdmin` role. Org-scoped analysis endpoints for opponent scouting.

### 10. Coaching Marketplace
AI identifies skill gaps from analyses → surfaces relevant human coaches → 20% platform cut.

---

## API Route Map (Tested 2026-04-05)

| Status | Method | Path | Notes |
|--------|--------|------|-------|
| ✅ | GET | /health | Works |
| ✅ | GET | /games | 1 game |
| ✅ | GET | /characters | 18 SF6 chars |
| ✅ | POST | /auth/register | Returns token |
| ✅ | POST | /auth/login | Returns token |
| ✅ | GET | /auth/me | Needs `x-auth-token` header |
| ✅ | POST | /analyze | Video analysis |
| ✅ | GET | /analysis/recent | Needs auth |
| ✅ | POST | /chat | No auth needed |
| ✅ | POST | /ingestion/trigger | Body: `game_id` (not `game`) |
| ✅ | GET | /gamification/stats | Needs auth |
| ✅ | GET | /training/missions | Needs auth (not `/plan`) |
| ✅ | POST | /onboarding/complete | Needs auth; body: `{gameId, characterId, skillLevel}` |
| ✅ | GET | /meta/:gameId/history | Works (empty) |
| ❌ | GET | /meta/:gameId | No scenarios in DB |
| ❌ | POST | /meta/:gameId/generate | No scenarios in DB |
| ❌ | GET | /meta/:gameId/query | Gemini quota error |
| ✅ | GET | /theory/:gameId/characters | Works (0 theories) |
| ❌ | GET | /theory/:gameId | Route not found (wrong path) |

---

## Database State (2026-04-05)

| Collection | Count | Notes |
|------------|-------|-------|
| games | 1 | SF6 only |
| characters | 18 | SF6 roster |
| scenarios | 0 | Empty — ingestion broken |
| metaReports | 0 | Depends on scenarios |
| theoryDocuments | 0 | Depends on scenarios |
| ingestionJobs | 0 | Nothing queued |
| missions | 5 | Seeded |
| users | Growing | Real users registering |
| analysis | Growing | Real analyses being run |
