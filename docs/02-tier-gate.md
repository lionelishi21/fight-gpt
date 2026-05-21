# 02 · Fix Tier Gate — /auth/me

**Priority:** 🔴 P0 — Revenue Blocker  
**Status:** `todo`  
**Effort:** 1–2 hours  
**Files:** `fight-gpt-node-backend/src/controllers/AuthController.ts`

---

## Problem

`user.tier` (or `user.planType`) is always `undefined` on both web and mobile.  
The `tier` field lives on the `UserGame` model, not the `User` model.  
`/auth/me` returns the User document without populating UserGame.

Result: every user appears as FREE tier regardless of their subscription.  
Premium features (unlimited analysis, theory library, AI coach) never unlock.

---

## Fix

In `AuthController.getMe()`, after fetching the user, look up their `UserGame`  
record and merge the `tier` field onto the response:

```typescript
// In AuthController.getMe()
const userGame = await UserGame.findOne({ user_id: user._id })
  .sort({ updatedAt: -1 })
  .lean();

return res.json({
  success: true,
  data: {
    user: {
      ...user.toObject(),
      tier:     userGame?.tier     || 'FREE',
      planType: userGame?.planType || 'free',
    }
  }
});
```

---

## Frontend Gate Locations

Once tier is returned correctly, these gates start working:

| Location | Gate |
|---|---|
| `AnalysisService.analyzeVideo()` | FREE: 3 lifetime, COMPETITOR: 30/mo, PRO: 150/mo |
| `app/(tabs)/analyze.tsx` | Show upgrade prompt if tier === 'FREE' and limit hit |
| Theory library | COMPETITOR+ only |
| AI Coach missions | COMPETITOR+ only |
| Priority queue | PRO+ only |

---

## Verification

```bash
curl -H "x-auth-token: YOUR_TOKEN" https://api.fightingames.online/api/auth/me
# Response should include: "tier": "COMPETITOR" (or FREE, PRO)
```
