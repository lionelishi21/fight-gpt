# 05 · Rival Watch

**Priority:** 🟠 P1 — Core Retention / Pro Feature  
**Status:** `todo`  
**Effort:** 1 day  

---

## What It Is

Users set a rival (another player or character they face a lot).  
When MetaPunish ingests a video featuring that rival, the user gets a push:  
**"Kazuya_God uploaded a new set — scout them now."**

This is a **Pro-tier exclusive** feature. It's the reason players stay on $75/month.

---

## Current State

- `RivalRepository` model exists
- `Rival` watch type is in notification types
- No frontend to add a rival
- No trigger when rival content is ingested

---

## Implementation

### Backend — Trigger on Ingestion
```typescript
// In AnalysisService — after saving a new analysis
// Check if any users are watching characters in this match
const watchers = await rivalRepository.findWatchersForCharacter(
  analysis.p1_character,
  analysis.game_id,
);
for (const watcher of watchers) {
  await notificationService.sendPush(
    watcher.pushToken,
    `Rival spotted — ${analysis.p1_character}`,
    `New ${analysis.game_id.toUpperCase()} footage analyzed. Check their tech.`,
    { type: 'rival_alert', analysisId: analysis.analysis_id }
  );
}
```

### Frontend — Add Rival UI
- Profile page: "Add Rival" button
- Input: player name or character to watch
- List of active rivals with remove option
- Rival analyses show in a dedicated "Scout" tab

---

## Gate
- Free: no rival watch
- Competitor: watch 1 rival
- Pro: watch up to 5 rivals
