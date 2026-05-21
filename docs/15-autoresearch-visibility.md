# 15 · AutoResearch Visibility

**Priority:** ⚙️ P5 — Platform Health  
**Status:** `todo`  
**Effort:** 3 hours  

---

## Problem

AutoResearchService runs in the background but there is no way to see:
- When it last ran
- How many scenarios it generated
- Which games/characters it researched
- Whether it's erroring silently

You are flying blind on your core intelligence pipeline.

---

## What to Add

### Backend — Research Log Model
```typescript
{
  game_id: string;
  run_at: Date;
  scenarios_generated: number;
  theories_generated: number;
  characters_covered: string[];
  errors: string[];
  duration_ms: number;
}
```

### Admin Dashboard — Research Log Panel
In the Intelligence tab, add a "Research Activity" section showing:

```
AUTORESEARCH LOG
────────────────────────────────────────────
Last run: 2h ago   ●  SF6
Scenarios generated: 12  ·  Theories: 1
Characters: [Cammy ×3] [AKI ×4] [Ken ×5]
Duration: 4m 23s   Status: ✓ Success

Last run: 1d ago   ●  TEKKEN 8
Scenarios generated: 0  ·  Theories: 0
⚠ Error: YouTube quota exceeded
────────────────────────────────────────────
```

### Admin — Manual Trigger Per Game
"Run Research Now" button per game that calls the existing  
`POST /admin/research/trigger` endpoint.

---

## Why This Matters

If the ingestion pipeline stops working (YouTube API quota, bad cookies, etc.)  
you won't know until users complain that the meta is stale.  
Visibility means you catch it in hours, not days.
