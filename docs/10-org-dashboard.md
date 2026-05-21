# 10 · Esports Org / B2B Dashboard

**Priority:** 🔵 P3 — $100K MRR potential  
**Status:** `todo`  
**Effort:** 1–2 weeks  

---

## Revenue Potential

50 orgs × $2,000/mo = **$100,000 MRR**  
This single feature tier pays for the entire infrastructure cost.

---

## What Orgs Need

1. **Opponent scouting reports** — "Give me everything on Kazuya_God before Combo Breaker"
2. **Roster performance tracking** — "How is our Tekken 8 player performing this month?"
3. **Tournament prep briefs** — "Top 8 at EVO — who are we likely to face?"
4. **Multi-user access** — coach + 3 players all under one org account

---

## MVP Scope (Ship First)

### New User Role: `orgAdmin`
```typescript
// User model addition
role: 'user' | 'admin' | 'orgAdmin'
orgId?: string
```

### New Model: `Organization`
```typescript
{
  name: string;
  slug: string;
  tier: 'org';
  seats: number;         // number of player accounts
  members: string[];     // User _ids
  games: string[];       // games the org focuses on
  stripeSubscriptionId: string;
  created_at: Date;
}
```

### Scouting Report Page
`/org/scout?player=Kazuya_God&game=tekken8`

Aggregates all analyses featuring that player tag:
- Win rate vs character matchups
- Most used punishes
- Identified bad habits
- Recent VODs analyzed

### Org Dashboard
`/org/dashboard`
- All members' recent analyses
- Team win rate by character
- Upcoming tournament prep checklist

---

## B2B Sales Motion

1. Reach out to top 10 FGC orgs (NRG, Cloud9, DarkStar, etc.)
2. Offer 30-day free trial
3. Demo the scouting report live with their own players
4. Close at $2,000/month

One closed deal = 80 free Competitor users in revenue equivalent.
