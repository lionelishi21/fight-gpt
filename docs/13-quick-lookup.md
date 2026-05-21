# 13 · Quick Frame Data Lookup (Mobile Home)

**Priority:** 🟢 P4 — Mobile Experience  
**Status:** `todo`  
**Effort:** 4 hours  

---

## What It Is

A search bar on the home screen answering: **"What does Ken's 5HP do on block?"**  
in 2 taps. Currently this requires navigating through 4+ screens.

---

## Design

```
Home Screen
┌─────────────────────────────────────────┐
│  🔍  Search character or move...        │
└─────────────────────────────────────────┘

[tap] → search overlay opens

┌─────────────────────────────────────────┐
│  🔍  Ken 5HP                            │
├─────────────────────────────────────────┤
│  KEN · SF6 · 5HP (Standing Heavy Punch) │
│  On block: -6  ← PUNISHABLE            │
│  On hit:   +2                           │
│  Startup:  9f  · Active: 3f            │
│                                         │
│  → Punish with cr.MP > SA2 (4,230 dmg) │
└─────────────────────────────────────────┘
```

---

## Implementation

### Search Index
When the encyclopedia loads, build a flat search index in memory:
```typescript
// index entry per move:
{ char: 'Ken', game: 'sf6', move: '5HP', onBlock: -6, onHit: 2, startup: 9 }
```

### Search Logic
- Tokenize: "ken 5hp" → ["ken", "5hp"]
- Match character name + move name
- Return top 5 results instantly (local search, no API call)

### Result Card
Shows frame data inline with colour coding:
- Red: -7 or worse (punishable, shows best punish)
- Yellow: -1 to -6 (borderline)
- Green: 0 or better (safe/plus)

---

## Impact

This is the feature players use 10× more than any other.  
"I blocked something — is it punishable?" answered in 2 seconds.  
This makes MetaPunish feel like a tool players can't put down.
