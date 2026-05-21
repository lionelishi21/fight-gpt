# 17 · Sentry Error Monitoring

**Priority:** ⚙️ P5 — Platform Health  
**Status:** `todo`  
**Effort:** 2 hours  

---

## Problem

You have no visibility into production errors. When something breaks, you find out  
when a user complains — not when it happens. Sentry gives you real-time alerts  
for every 500 error, crash, and slow query.

Sentry free tier: 5,000 errors/month — more than enough.

---

## Backend Setup

```bash
cd fight-gpt-node-backend
npm install @sentry/node
```

```typescript
// src/index.ts — before any routes
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// After routes — catch unhandled errors
app.use(Sentry.Handlers.errorHandler());
```

---

## Frontend Setup (Next.js)

```bash
cd fightingamesio-frontend
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard auto-generates `sentry.client.config.ts` and `sentry.server.config.ts`.

---

## Mobile Setup (Expo)

```bash
npx expo install @sentry/react-native
```

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
```

---

## What You'll See in Sentry

- Every 500 error with full stack trace and request context
- Frontend JavaScript exceptions
- Mobile app crashes with device info
- Slow database queries (performance monitoring)
- Alert when error rate spikes → email/Slack notification

---

## ENV Vars to Add
```
SENTRY_DSN=https://xxxx@sentry.io/xxx        # backend
NEXT_PUBLIC_SENTRY_DSN=https://...            # frontend
EXPO_PUBLIC_SENTRY_DSN=https://...            # mobile
```
