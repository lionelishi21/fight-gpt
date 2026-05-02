# FightGPT — Automation & Character Intelligence Plan

**Created:** 2026-05-02  
**Status:** In Progress  
**Goal:** Automate ingestion→meta pipeline, move all character/game config to DB, fix mission display bugs, and establish a structured onboarding flow for new games and patches — without breaking anything currently working.

---

## Guiding Principles

- Every change is **backward-compatible** — new DB fields have defaults, no existing documents break
- Each item is a **separate commit** with its own dist/ rebuild so any single item can be reverted
- No TypeScript errors introduced — zero-error build after each step
- All new collections are **optional** — services fall back gracefully if data is missing

---

## P0 — Fix Now (< 2 hours)

### P0-A: Fix Mission Detail "undefined" Character Name

**Problem:** `MissionDetailService` reads `user.slots[user.activeSlotIndex]` but `activeSlotIndex` doesn't exist on older User documents, and `slot.characterId` may be undefined. Result: character name and video labels show as "undefined".

**Files:**
- `src/services/MissionDetailService.ts`
- `src/controllers/TrainingController.ts`

**Changes:**
1. Replace numeric slot index with game-aware slot lookup:
   ```typescript
   // OLD (breaks on missing index)
   const activeSlot = user.slots[user.activeSlotIndex];
   
   // NEW (finds slot by gameId, falls back to first slot)
   const activeSlot = user.slots?.find(s => s.gameId === gameId)
       || user.slots?.[0];
   ```
2. Resolve character display name from Character collection:
   ```typescript
   const charDoc = await Character.findOne({
       game_id: gameId,
       $or: [
           { name: new RegExp(`^${playerChar}$`, 'i') },
           { aliases: playerChar }
       ]
   }).lean();
   const characterDisplayName = charDoc?.name || playerChar;
   ```
3. Enrich mission response with `characterName` and `gameTitle` fields.

**Risk:** Zero — purely additive. Null-safe reads, fallback to `'ryu'` preserved.

---

### P0-B: Wire Ingestion → Auto-Trigger Meta Synthesis

**Problem:** `IngestionService.processQueue()` and `MetaService.generateMetaReport()` run on independent cron schedules. New videos can sit in DB for up to 24 hours before appearing in meta reports.

**Files:**
- `src/services/IngestionService.ts`
- `src/index.ts`

**Changes:**
1. Add optional `metaService` param to `IngestionService` constructor:
   ```typescript
   constructor(
       private readonly ingestionRepository: IIngestionRepository,
       private readonly analysisService: IAnalysisService,
       private readonly metaService?: IMetaService,  // NEW — optional
   )
   ```
2. After `processQueue()` loop completes with `processed > 0`, auto-trigger meta for each affected game:
   ```typescript
   if (processed > 0 && this.metaService) {
       const gameIds = [...new Set(jobs.map(j => j.game_id))];
       for (const gid of gameIds) {
           await this.metaService.generateMetaReport(gid, 'weekly')
               .catch(e => Logger.warn(`Meta auto-gen failed for ${gid}`, e));
       }
   }
   ```
3. Wire `metaService` into `IngestionService` in `index.ts`.

**Risk:** Near-zero. `metaService` is optional — if null, nothing changes. Meta failure is caught and logged, never crashes ingestion.

---

## P1 — This Week (< 1 day)

### P1-A: Character Aliases in DB + DB-Driven Names in MetaService

**Problem:** `KNOWN_CHARACTERS` in MetaService is hardcoded. Adding a new game or new DLC character requires a code deploy.

**Files:**
- `src/models/Character.ts`
- `src/repositories/CharacterRepository.ts`
- `src/services/MetaService.ts`
- `src/index.ts`

**Changes:**

1. **Character model** — add `aliases` field with empty default:
   ```typescript
   aliases: { type: [String], default: [], index: true }
   // e.g. Chun-Li: aliases: ['chun-li', 'chunli', 'chun_li']
   // e.g. M.Bison: aliases: ['m_bison', 'bison', 'm.bison']
   ```

2. **CharacterRepository** — add `getNamesByGame()`:
   ```typescript
   async getNamesByGame(gameId: string): Promise<string[]> {
       const chars = await this.model.find(
           { game_id: gameId, is_current: true },
           { name: 1, aliases: 1 }
       ).lean();
       return chars.flatMap(c => [
           c.name.toLowerCase().replace(/\s+/g, '_'),
           ...(c.aliases || [])
       ]);
   }
   ```

3. **MetaService** — inject optional `ICharacterRepository`, replace hardcoded constant:
   ```typescript
   private async getKnownCharacters(gameId: string): Promise<string[]> {
       if (this.characterRepository) {
           const names = await this.characterRepository.getNamesByGame(gameId);
           if (names.length > 0) return names;
       }
       return KNOWN_CHARACTERS[gameId] || [];  // hardcoded fallback preserved
   }
   ```

4. Update `extractCharactersFromText()` to call `getKnownCharacters()` asynchronously.

5. Update all `Character.create()` calls in AdminService to support the `aliases` field.

**Risk:** Low. Existing characters without `aliases` still work — `getNamesByGame()` returns their lowercased name. Hardcoded fallback preserved.

---

### P1-B: GameSearchStrategy — Ingestion Queries to DB

**Problem:** `GAME_SEARCH_QUERIES` in IngestionService is hardcoded. Can't update queries for a new patch or new game without a deploy.

**Files:**
- `src/models/GameSearchStrategy.ts` *(new)*
- `src/repositories/GameSearchStrategyRepository.ts` *(new)*
- `src/services/IngestionService.ts`
- `src/routes/adminRoutes.ts`
- `src/controllers/AdminController.ts`

**New model `GameSearchStrategy`:**
```typescript
{
    game_id: string;           // indexed
    queries: string[];         // YouTube search strings
    patch_version: string;     // which patch these apply to
    is_active: boolean;        // default true
    priority: number;          // 0=normal, 1=high (post-patch)
    created_at, updated_at
}
```

**IngestionService change:**
```typescript
// Replaces GAME_SEARCH_QUERIES constant lookup
private async getSearchQueries(gameId: string): Promise<string[]> {
    const strategies = await this.searchStrategyRepository
        ?.findActive(gameId);
    if (strategies?.length) return strategies[0].queries;
    return GAME_SEARCH_QUERIES[gameId] || DEFAULT_QUERIES(gameId);  // fallback
}
```

**New admin endpoints:**
```
POST /api/admin/games/:gameId/search-strategies     — add queries
GET  /api/admin/games/:gameId/search-strategies     — list queries
PATCH /api/admin/games/:gameId/search-strategies/:id — update
DELETE /api/admin/games/:gameId/search-strategies/:id — remove
```

**Risk:** Low. `searchStrategyRepository` is optional — if null or empty, falls back to hardcoded constant. Zero behavior change for existing games.

---

## P2 — Next Sprint (< 1 day each)

### P2-A: GameOnboardingService — One-Call Game Setup

**Problem:** Adding a new game requires: manual Game record, manual seeder script, manual run, add to `GAME_SEARCH_QUERIES` in code, redeploy. High friction.

**New endpoint:** `POST /api/admin/games/onboard`

**Payload:**
```json
{
    "game_id": "ggst",
    "name": "Guilty Gear Strive",
    "publisher": "Arc System Works",
    "match_format": "1v1",
    "latest_version": "1.38",
    "search_queries": [
        "Guilty Gear Strive EVO 2024 top 8",
        "GGST high level ranked match"
    ],
    "characters": [
        { "name": "Sol Badguy", "aliases": ["sol", "sol_badguy"], "archetype": "Rushdown" },
        { "name": "Ky Kiske",   "aliases": ["ky"],               "archetype": "Balance" }
    ]
}
```

**What it does in one transaction:**
1. Creates `Game` document
2. Batch-creates all `Character` documents (`version = latest_version`, `is_current = true`)
3. Creates empty `CharacterEncyclopedia` entries for each character
4. Creates `GameSearchStrategy` entry with provided queries
5. Queues first ingestion run (`POST /ingestion/trigger`)
6. Returns onboarding summary with counts

**File:** `src/services/GameOnboardingService.ts` *(new)*

**Risk:** Medium-low. Wrapped in a transaction-like try/catch. If any step fails, the response reports which steps succeeded and which failed. Existing data untouched.

---

### P2-B: PatchEvent — Patch Lifecycle Automation

**Problem:** No concept of "patch just dropped". The system doesn't know to re-ingest post-patch content or mark old character data as stale.

**New model `PatchEvent`:**
```typescript
{
    game_id: string;
    version: string;                  // e.g. "8.1.0"
    previous_version: string;
    released_at: Date;
    patch_notes_url?: string;
    changed_characters: string[];     // character IDs affected
    status: 'pending' | 'ingesting' | 'synthesized';
    created_at, updated_at
}
```

**New endpoint:** `POST /api/admin/games/:gameId/patch`

**Payload:**
```json
{
    "version": "8.1.0",
    "changed_characters": ["akuma", "ken", "cammy"],
    "patch_notes_url": "https://..."
}
```

**What it does:**
1. Creates `PatchEvent` document
2. Updates `Game.latest_version`
3. Sets `Character.is_current = false` for old versions of changed characters
4. Creates new `Character` documents (copy + version bump) for changed characters
5. Creates high-priority `GameSearchStrategy` entries for post-patch queries:
   - `"sf6 akuma patch 8.1 gameplay"`
   - `"sf6 ken 8.1 combo guide"`
6. Immediately triggers ingestion with these high-priority queries
7. Tags resulting `Scenario` documents with `patch_version: "8.1.0"`

**Result:** Within hours of a patch, the system has fresh footage, new scenarios tagged to the patch, and an updated meta report.

**Risk:** Medium. Carefully scoped — only changes characters in `changed_characters` list. Does NOT delete old character documents (sets `is_current = false`). Admin can review before triggering.

---

## Data Flow After All Changes

```
Admin declares new game or patch
        ↓
GameOnboardingService / PatchEvent API
        ↓
Game + Characters + SearchStrategies created in DB
        ↓
IngestionService reads SearchStrategies from DB
        ↓
YouTube API searched → videos queued → Gemini analyzes
        ↓
Scenarios stored in MongoDB with patch_version tag
        ↓
MetaService auto-triggered (P0-B) → reads characters from DB (P1-A)
        ↓
Tier list built from DB character names (not hardcoded)
        ↓
Theory docs generated per character
        ↓
Users see updated meta + theory within hours of patch drop
```

---

## Implementation Order

| # | Task | Est | Breaks Anything? |
|---|------|-----|-----------------|
| 1 | P0-A: Fix mission undefined character | 30 min | No |
| 2 | P0-B: Ingestion → auto-trigger meta | 45 min | No |
| 3 | P1-A: Character aliases + DB names in MetaService | 90 min | No |
| 4 | P1-B: GameSearchStrategy model + DB queries | 90 min | No |
| 5 | P2-A: GameOnboardingService endpoint | 3 hrs | No |
| 6 | P2-B: PatchEvent lifecycle | 4 hrs | No |

Each item is a separate commit. Each commit rebuilds `dist/` before pushing so the server always runs tested compiled code.

---

## Safety Checklist (Before Each Commit)

- [ ] `npx tsc --noEmit` returns zero errors
- [ ] New DB fields have `default:` values (existing documents unaffected)
- [ ] New services accept optional deps (never crash if null)
- [ ] New endpoints return meaningful errors on bad input
- [ ] `npm run build` succeeds
- [ ] Server health check passes after deploy
