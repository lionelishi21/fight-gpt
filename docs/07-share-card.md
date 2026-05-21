# 07 · Shareable Analysis Card

**Priority:** 🟡 P2 — Growth  
**Status:** `todo`  
**Effort:** 1 day  

---

## What It Is

After an analysis completes, generate a branded image card the user can  
share to Twitter/Discord/Reddit. Every share is free advertising.

**Card design:**
```
┌─────────────────────────────────────┐
│  METAPUNISH INTELLIGENCE            │
│  ─────────────────────────────────  │
│  CAMMY  vs  RYU  ·  SF6            │
│                                     │
│  3 punish windows found             │
│  2 missed conversions               │
│  "Your cr.MK → SA2 window is +6"   │
│                                     │
│  metapunish.com/matches/[id]        │
└─────────────────────────────────────┘
```

---

## Implementation Options

### Option A — Server-Side Image (Best Quality)
Use `@vercel/og` or `satori` in a Next.js API route to generate a PNG from JSX.

```typescript
// src/app/api/og/analysis/[id]/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(req, { params }) {
  const analysis = await fetchAnalysis(params.id);
  return new ImageResponse(
    <AnalysisCard analysis={analysis} />,
    { width: 1200, height: 630 }
  );
}
```

### Option B — Client-Side Canvas (Easier)
Use `html2canvas` or `react-native-view-shot` on the existing analysis card UI.

---

## Share Flow

1. User taps "Share" on analysis detail page
2. Card image generates (1200×630 for Twitter/OG)
3. Native share sheet opens (web: Web Share API, mobile: `expo-sharing`)
4. URL contains full analysis link → recipients can view full breakdown

---

## SEO Benefit

The `og:image` for every analysis page becomes this card.  
When anyone shares a match link on Discord/Twitter, the preview looks branded.
