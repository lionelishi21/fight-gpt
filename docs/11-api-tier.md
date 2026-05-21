# 11 · Data API Tier

**Priority:** 🔵 P3 — $50K MRR potential  
**Status:** `todo`  
**Effort:** 3 days  

---

## Revenue Potential

10 clients × $5,000/mo = **$50,000 MRR**  
Target: tournament platforms, coaching apps, FGC stat sites, content creators.

---

## What the API Exposes

```
GET /api/v1/meta/:gameId                  — Latest meta report
GET /api/v1/characters/:gameId            — All characters with win rates
GET /api/v1/frame-data/:gameId/:charId    — Full frame data for a character
GET /api/v1/scenarios/:gameId?char=cammy  — Recent verified scenarios
GET /api/v1/theories/:gameId/:charId      — Latest character theory doc
GET /api/v1/tier-list/:gameId             — Current tier list with percentages
```

---

## Implementation

### API Key Model
```typescript
{
  key: string;          // uuid, hashed in DB
  userId: string;
  name: string;         // "My coaching app"
  rateLimit: number;    // requests per hour
  created_at: Date;
  last_used: Date;
}
```

### Rate Limiting by Tier
| Tier | Requests/hour |
|---|---|
| Data API ($5K/mo) | 10,000 |
| Org ($2K/mo) | 1,000 |
| Pro ($75/mo) | 100 |

### Authentication
```
GET /api/v1/meta/sf6
Authorization: Bearer mp_live_xxxxxxxxxxxx
```

---

## Why Clients Pay $5K/Month

Your data is unique — it's synthesized from thousands of tournament VODs  
and updated continuously. No other platform has:
- Real win rates from actual tournament play (not character select popularity)
- 48-hour patch turnaround with AI-synthesized frame data
- Natural language theory documents per character

Coaching platforms alone will pay to embed this into their subscription apps.
