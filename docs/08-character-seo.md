# 08 · Public Character SEO Pages

**Priority:** 🟡 P2 — Growth (Free organic traffic)  
**Status:** `todo`  
**Effort:** 1–2 days  

---

## Why This Is High Value

People Google "SF6 Cammy frame data" thousands of times per day.  
A public page at `metapunish.com/characters/sf6/cammy` will rank for those searches  
and convert visitors into signups — with zero ad spend.

---

## Page Structure

```
/characters/sf6/cammy

┌── Hero ──────────────────────────────────────────────────────┐
│  CAMMY · Street Fighter 6                                     │
│  Tier: A · Win Rate: 55.1% (↑ +0.4% this patch)            │
│  "Meta as of Patch 2.1 — updated 2 days ago"                │
└───────────────────────────────────────────────────────────────┘

┌── Key Frame Data ─────────────────────────────────────────────┐
│  cr.MP  on block: +1  on hit: +5  startup: 5f               │
│  5HP    on block: -6  on hit: +2  startup: 9f  ← PUNISHABLE │
│  SA2    on block: +3  invincible frames 1-7                  │
└───────────────────────────────────────────────────────────────┘

┌── This Week's Meta ───────────────────────────────────────────┐
│  "Cammy's DR > LK Spiral Arrow is being adopted by top 8..."  │
│  Sourced from 47 tournament VODs this week                    │
└───────────────────────────────────────────────────────────────┘

┌── CTA ────────────────────────────────────────────────────────┐
│  Want Cammy-specific coaching? [Analyze Your Set →]           │
└───────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Route
```
fightingamesio-frontend/src/app/characters/[gameId]/[characterId]/page.tsx
```

### Data Sources
- Frame data: `CharacterEncyclopedia` collection
- Win rate: aggregated from `Scenario` collection
- Meta text: latest `TheoryDocument` for this character
- Trending tech: top scenarios by `created_at` this week

### SEO Metadata
```typescript
export async function generateMetadata({ params }) {
  return {
    title: `${params.characterId} Frame Data & Meta — ${params.gameId.toUpperCase()} | MetaPunish`,
    description: `Current ${params.characterId} tier, win rates, frame data, and meta breakdown for ${params.gameId.toUpperCase()} Patch 2.1. Updated from live tournament data.`,
  };
}
```

### Static Generation
Use `generateStaticParams()` to pre-render all character pages at build time.  
Revalidate every 24 hours with ISR (`revalidate: 86400`).

---

## Expected Traffic (6 months)

| Search Term | Monthly Searches | Expected Rank |
|---|---|---|
| "SF6 Cammy frame data" | ~2,000 | Top 5 |
| "Tekken 8 Kazuya guide" | ~1,500 | Top 10 |
| "Street Fighter 6 tier list 2025" | ~8,000 | Top 20 |
| Total across all characters | ~50,000/mo | — |

At 3% conversion to signup → **1,500 new signups/month from SEO alone.**
