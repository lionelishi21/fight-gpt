# 03 · Push Notifications

**Priority:** 🟠 P1 — Core Retention  
**Status:** `todo`  
**Effort:** 1 day  
**Files:** Backend `NotificationService.ts`, Mobile `app/_layout.tsx`, `lib/notifications.ts`

---

## Why This Matters

Fighting game players check meta shifts obsessively. A push notification that says  
**"SF6 Patch 2.1 analysis is live — AKI moved to S tier"** will bring every player back  
within minutes. This is the strongest re-engagement lever you have.

---

## What to Send

| Trigger | Notification | Audience |
|---|---|---|
| New patch analyzed | "SF6 Patch 2.1 is live — see what changed" | All SF6 users |
| Daily missions reset | "Your daily missions are ready — earn XP" | All users |
| Theory doc generated | "New AKI theory dropped — read the breakdown" | Users who main AKI |
| Rival spotted | "Kazuya_God uploaded a new set — scout them now" | Pro users with rival watch |
| Analysis complete | "Your Cammy vs Ryu set is analyzed — 3 punish windows found" | User who submitted |
| Weekly meta brief | "Week 20 meta brief is ready" | Competitor+ users |

---

## Architecture

### Backend — Push Token Storage
```typescript
// Add to User model
pushToken?: string;   // Expo push token

// New endpoint: POST /auth/push-token
// Called from mobile app on login/startup
router.post('/push-token', authMiddleware, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { pushToken: req.body.token });
  res.json({ success: true });
});
```

### Backend — Send Push via Expo API
```typescript
// In NotificationService.ts — add sendPush()
async sendPush(token: string, title: string, body: string, data?: any) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
}

// Broadcast to all users with a given game
async broadcastPatchAlert(gameId: string, patchVersion: string) {
  const users = await User.find({ 
    'preferences.games': gameId, 
    pushToken: { $exists: true, $ne: null }
  }).lean();
  
  for (const user of users) {
    await this.sendPush(
      user.pushToken,
      `${gameId.toUpperCase()} Patch ${patchVersion} analyzed`,
      'New tier movements and tech — see what changed'
    );
  }
}
```

### Mobile — Register Token on App Start
```typescript
// In app/_layout.tsx — already has expo-notifications installed
import * as Notifications from 'expo-notifications';
import { authApi } from '@/lib/api';

async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await authApi.savePushToken(token);
}
```

---

## Where to Trigger Notifications

| Location | Notification |
|---|---|
| `IngestionService` — after theory generated | Broadcast patch alert |
| `AnalysisService` — after user upload completes | Send to submitting user |
| Cron job — 6 AM daily | Daily mission reset |
| Cron job — Monday 8 AM | Weekly meta brief |
| `RivalRepository` — after rival ingested | Send to watching user |
