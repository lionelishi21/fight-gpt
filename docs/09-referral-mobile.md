# 09 · Referral Flow (Mobile)

**Priority:** 🟡 P2 — Growth  
**Status:** `todo`  
**Effort:** 4 hours  

---

## What It Is

Every user has a `referralCode` in the DB. The mobile app has no UI to use it.  
Add a simple "Invite a friend" button that shares a referral link.  
Both users get 1 bonus analysis when the friend signs up.

---

## Implementation

### Mobile — Invite Button (Profile tab)
```typescript
import { Share } from 'react-native';

const handleInvite = async () => {
  const link = `https://metapunish.com/signup?ref=${user.referralCode}`;
  await Share.share({
    message: `I've been using MetaPunish to level up my fighting game — check it out: ${link}`,
    url: link,
  });
};
```

### Backend — Credit on Signup
Already partially wired in `AuthController`. When a user signs up with `?ref=CODE`:
1. Look up the referring user by `referralCode`
2. Increment `referrer.referralCount`
3. Add 1 bonus analysis to both accounts (`referralCredits + 1`)
4. Send notification to referrer: "Your invite was accepted — +1 free analysis"

---

## Referral Stats Screen
Show on Profile tab:
- Your referral link (tap to copy)
- Friends invited: 3
- Credits earned: 3 extra analyses
- Leaderboard: "Top referrers this month"
