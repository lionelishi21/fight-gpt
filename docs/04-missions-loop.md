# 04 · Daily Missions Loop

**Priority:** 🟠 P1 — Core Retention  
**Status:** `todo`  
**Effort:** 4 hours  

---

## Problem

Daily missions exist in the DB but users don't know they reset, don't get notified,  
and there's no visible countdown or badge on the app icon.

A daily habit loop requires a daily trigger. Without it, missions are invisible.

---

## Required Changes

### 1. Mission Reset Cron (Backend)
```
Every day at 00:00 UTC:
- Mark all AVAILABLE UserMissions as EXPIRED
- Generate fresh missions for each active user
- Send push notification to all users with pushToken
```

### 2. Badge Count on App Icon (Mobile)
```typescript
// Show number of uncompleted missions as app badge
import * as Notifications from 'expo-notifications';

const pendingMissions = missions.filter(m => m.status === 'AVAILABLE').length;
await Notifications.setBadgeCountAsync(pendingMissions);
```

### 3. Mission Card on Dashboard with Countdown
Show "Missions reset in 4h 23m" countdown on the dashboard home tab.

### 4. Streak Tracking
Add `missionStreak` field to User. Increment on any day with at least 1 completed  
mission. Show streak on profile: "🔥 7-day streak". This is the strongest  
daily habit driver — users protect their streak.

---

## Streak Impact on Revenue

| Streak Length | User Behaviour |
|---|---|
| 1–3 days | Casual, likely to churn |
| 7 days | Forming habit, 3× less likely to cancel |
| 30 days | Power user, likely to upgrade to Pro |

Show streak prominently: dashboard, profile, leaderboard.
