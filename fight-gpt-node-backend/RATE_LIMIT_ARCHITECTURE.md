# MetaPunish — Rate Limit & Traffic Layer Architecture Plan

> **Context**: Going live next week. Target: 1,000 users Week 1. Long-term: 100,000+ users.
> **Goal**: Separate the internal research/worker layer from the user-facing API layer to prevent rate limit bleed-through and ensure stability at scale.

---

## Current Problem Summary

All traffic — user browsing, admin dashboard polling, the ingestion scheduler, and the research worker — share **one single rate limit bucket per IP address**.

```
Current (Broken at Scale)
─────────────────────────
ALL /api/* → Global Limiter (1,000 req / 15 min per IP)
              ├── User browsing characters
              ├── User AI chat
              ├── Dashboard polling every 60s
              ├── Ingestion scheduler triggers
              └── Research worker requests
```

```
Target (Correct Architecture)
──────────────────────────────
/api/admin/*      → Internal key auth, NO IP rate limit
/api/research/*   → Server IP whitelist, NO IP rate limit
/api/chat/*       → Per-authenticated-user limit (by userId, not IP)
/api/characters/* → High/no limit (public, cacheable data)
/api/analysis/*   → Per-user, tier-based limit (expensive AI calls)
/api/auth/*       → Strict brute-force protection (separate limiter)
```

---

## Priority Tiers

| Priority | Label | When to Do |
|----------|-------|------------|
| 🔴 | **CRITICAL** | Before go-live next week — will cause real user-facing failures |
| 🟡 | **IMPORTANT** | Within 2–4 weeks post-launch — won't break launch but adds risk |
| 🟢 | **FUTURE** | When approaching 10,000+ users — premature to do now |

---

## ✅ Already Implemented — Per-User Analysis Quotas (Tier-Based)

Unlike the IP-based rate limiting described below, video analysis requests are **already** gated server-side by user tier — this is separate from (and predates) the I2 plan further down.

**Where**: `src/services/AnalysisService.ts` (~lines 95–116), backed by `AnalysisRepository.countRecentAnalysesByUser(userId, hours)` (`src/repositories/AnalysisRepository.ts:109-117`).

**Current limits** (`LIMITS` dict, `AnalysisService.ts` ~line 101):

| Tier | Limit |
|------|-------|
| `FREE` | 3 analyses, lifetime cap (not rolling) |
| `COMPETITOR` | 30 per rolling 30 days |
| `PRO` | 150 per rolling 30 days |

**Flow**: `POST /api/analyze` → `optionalAuthMiddleware` (attaches `req.user` if a JWT is present, `src/middleware/auth.ts:40-49`) → `AnalysisController` → `AnalysisService.analyzeVideo(request, userId)` → quota check against `User.tier` → proceeds or returns a rejection with the limit reason (`AnalysisService.ts:110-115`).

**Open question — anonymous users**: because the route uses `optionalAuthMiddleware` rather than `authMiddleware`, requests with no JWT have no `req.user`, so it's worth confirming whether the quota check has an equivalent guard for anonymous traffic or whether anonymous analysis should simply require login.

**Frontend note**: the actual enforcement must stay server-side (tied to `user.tier` + the Mongo count above) since client-side counters are trivially bypassed. `localStorage` should only *mirror* the count for instant UI feedback (e.g., "2/3 free analyses used"), synced from the rejection payload `AnalysisService.ts` returns when the limit is hit.

To change the FREE cap (e.g., 3 lifetime → 5/month), edit the `LIMITS` dict at `AnalysisService.ts` ~line 101 and switch the lifetime check to `countRecentAnalysesByUser(userId, 30 * 24)`.

---

## 🔴 CRITICAL — Do Before Launch (Week 1, ~1,000 Users)

### C1 — Admin/Internal Routes: Bypass IP Rate Limiter

**Problem**: The dashboard polls `/api/admin/stats` every 60s. This drains from the same bucket as your real users. If you're using the dashboard while users are active, you hit the limit faster.

**Impact at 1,000 users**: High. You'll experience 429s on your own admin panel while users are active.

**What to change**:
- Add a secret `X-Admin-Key` header check middleware
- Apply it to all `/api/admin/*` routes
- Exempt those routes from the IP rate limiter entirely
- Store the key in `.env` as `ADMIN_API_SECRET`

**Files to change**:
- `src/middleware/adminKeyAuth.ts` — **[NEW]** simple header check
- `src/routes/adminRoutes.ts` — apply new middleware, remove IP limiter
- `src/index.ts` — make `limiter` not apply to `/api/admin/`
- Frontend `dashboardService.ts` — send the `X-Admin-Key` header
- `.env` — add `ADMIN_API_SECRET=<generate a long random string>`

**Effort**: ~1 hour

---

### C2 — Auth Routes: Dedicated Brute-Force Limiter

**Problem**: `/api/auth/login` and `/api/auth/register` currently share the same global limiter. At 1,000 users signing up in a short window, legitimate sign-ups could be blocked. Worse, there's no dedicated protection against password brute-forcing.

**Impact at 1,000 users**: Medium-High. Signup storms will self-block. Security gap on login.

**What to change**:
- Create a dedicated, strict limiter: `5 attempts / 15 min per IP` on auth routes
- Remove auth routes from the global limiter (they need stricter, not looser)

**Files to change**:
- `src/index.ts` — add `authLimiter` with `max: 5, windowMs: 15 * 60 * 1000`
- `src/routes/authRoutes.ts` — apply `authLimiter` directly on login/register routes

**Effort**: ~30 minutes

---

### C3 — Reduce Dashboard Polling Frequency

**Problem**: The dashboard currently polls `/api/admin/stats` every 60 seconds. With the worker status check, discovery feed, and sensei stats, the dashboard alone generates ~3 requests/minute from your browser. If you have the dashboard open all day, that's ~180 requests/hour just from you.

**Impact at 1,000 users**: Medium. Immediate relief without architectural changes.

**What to change**:
- Increase polling interval for `getSystemStats` from 60s → 5 minutes (worker status doesn't need to be real-time)
- The discovery feed (`DiscoveryFeed`) should only poll if the user is actively on the page (use `visibilitychange` event)

**Files to change**:
- `src/app/dashboard/page.tsx` — change `60000` to `300000` (5 min)
- `src/components/dashboard/DiscoveryFeed.tsx` — add `document.addEventListener('visibilitychange')` guard

**Effort**: ~20 minutes

---

## 🟡 IMPORTANT — Do Within 2–4 Weeks Post-Launch

### I1 — Switch Rate Limiting from Per-IP to Per-Authenticated-User

**Problem**: IP-based rate limiting is fundamentally broken for a real user base because:
- University campuses, offices, and mobile carriers share one IP for hundreds of people
- A user behind a corporate proxy looks identical to 500 other users
- Legitimate users get blocked because someone else on their network hit the limit

**Impact threshold**: Starts causing real support issues around 500–2,000 users.

**What to change**:
- Use `express-rate-limit` with a custom `keyGenerator` that returns `req.user?.id` if the user is authenticated, or falls back to IP for anonymous routes
- This requires the JWT auth middleware to run **before** the rate limiter (currently the limiter runs first)

**Files to change**:
- `src/index.ts` — reorder: auth middleware → rate limiter; add `keyGenerator` function
- `src/middleware/auth.ts` — ensure `req.user` is populated before rate limit runs
- `src/config/app.ts` — add `RATE_LIMIT_PER_USER_MAX` env var

**Effort**: ~2 hours

---

### I2 — Tier-Based Rate Limits for AI Endpoints

**Problem**: `/api/analysis/*` and `/api/chat/*` call Gemini, which is expensive. A free user spamming the chat endpoint costs you real money and blocks paid users.

**What to change**:
- Check `req.user.tier` (or subscription status) and apply different limits:
  - `free`: 20 AI requests / hour
  - `pro`: 200 AI requests / hour  
  - `admin`: unlimited
- Return a descriptive error with upgrade CTA when limit is hit: `"Upgrade to Pro for unlimited AI coaching"`

**Files to change**:
- `src/middleware/tierRateLimit.ts` — **[NEW]** tier-aware rate limiter middleware
- `src/routes/analysisRoutes.ts` — apply `tierRateLimit` middleware
- `src/routes/chatRoutes.ts` (or equivalent) — apply `tierRateLimit` middleware

**Effort**: ~2–3 hours

---

### I3 — Cache Public Read Endpoints

**Problem**: `/api/characters`, `/api/games`, `/api/characters/:id/encyclopedia` are called constantly but rarely change. Every user request hits MongoDB.

**What to change**:
- Add simple in-memory TTL cache (or Redis if already available) for these routes
- Cache `characters` list for 10 minutes, encyclopedia data for 30 minutes
- Serve cached response without hitting the rate limiter or DB

**Files to change**:
- `src/middleware/cacheMiddleware.ts` — **[NEW]** simple TTL cache using `node-cache` or Map
- `src/routes/characterRoutes.ts` — apply cache middleware to GET routes
- `src/routes/gameRoutes.ts` — apply cache middleware to GET routes

**Effort**: ~2–3 hours

---

### I4 — Move Ingestion Scheduler to Worker Process

**Problem**: The `IngestionService` scheduler fires from within the main API process (`fightgpt-api`). This means all internal ingestion HTTP calls appear to come from `127.0.0.1`. The Gemini API calls from the scheduler compete with live user AI requests for Gemini's per-minute token quota.

**What to change**:
- The worker (`fightgpt-worker`) should be the only process that triggers Gemini for ingestion
- The main API should only handle user-facing requests
- Move `ingestionService.startScheduler()` to `worker.ts` instead of `index.ts`

**Files to change**:
- `src/worker.ts` — start ingestion scheduler here
- `src/index.ts` — remove `ingestionService.startScheduler()` call
- `ecosystem.config.js` — no changes needed (worker is already a separate PM2 process)

**Effort**: ~1 hour

---

## 🟢 FUTURE — For 10,000+ Users (Don't Do Now)

### F1 — Redis-Backed Distributed Rate Limiting

**Why not now**: `express-rate-limit` uses in-memory storage by default. This is fine for a single-instance server. If you ever add a second EC2 instance, rate limits won't be shared between instances.

**When needed**: When you run 2+ API server instances (typically at 10k+ concurrent users).

**What it requires**: `rate-limit-redis` package + Redis connection in the rate limiter config.

---

### F2 — CDN-Level Rate Limiting (Cloudflare)

**Why not now**: Expensive to set up correctly and overkill for 1k users.

**When needed**: At 50k+ users, you want Cloudflare Workers or AWS WAF to absorb traffic before it even hits your EC2 instance.

---

### F3 — API Gateway (AWS API Gateway or Kong)

**Why not now**: Significant infrastructure complexity. Adds latency if misconfigured.

**When needed**: At 100k users, when you need fine-grained per-route analytics, circuit breakers, and request transformation.

---

## Decision Matrix for Next Week Launch

| Change | Risk if Skipped | Effort | Do Before Launch? |
|--------|----------------|--------|-------------------|
| C1 — Admin key bypass | Dashboard 429s while users active | 1 hr | ✅ **YES** |
| C2 — Auth brute-force limiter | Security gap + signup storms | 30 min | ✅ **YES** |
| C3 — Reduce polling frequency | Dashboard contributes to rate limit | 20 min | ✅ **YES** |
| I1 — Per-user rate limits | Shared-IP false positives | 2 hr | ⚠️ Risky to skip, survivable at 1k |
| I2 — Tier-based AI limits | Free users cost $ unchecked | 2-3 hr | ⚠️ Do if you have a free tier |
| I3 — Cache public routes | Extra DB load | 2-3 hr | 🔵 Can wait |
| I4 — Move scheduler to worker | Minor Gemini contention | 1 hr | 🔵 Can wait |
| F1-F3 — Distributed/CDN/Gateway | N/A at 1k scale | High | 🔵 Do NOT do now |

---

## ⚠️ Higher-Priority Launch Risks (Non-Rate-Limit)

At **1,000 users**, the most likely failure modes are actually **not** the rate limiter — they are:

1. **Gemini API token quota** — if 50+ users chat simultaneously, you'll hit Gemini's per-minute token limit, causing AI errors for everyone
   - *Mitigation*: Check your Google Cloud Gemini quota dashboard. Request a quota increase before launch.

2. **MongoDB connection pool exhaustion** — the default Mongoose pool is 5 connections; at 1k concurrent users this will queue up
   - *Mitigation*: Add `{ maxPoolSize: 50 }` to your `mongoose.connect()` options in `src/config/database.ts`

3. **EC2 memory pressure** — the worker doing video analysis is capped at 1GB in PM2, but the API itself has no cap
   - *Mitigation*: Monitor with `pm2 monit` after launch; set `max_memory_restart: '400M'` on the API process

4. **Cold start ingestion blast** — the new immediate startup ingestion will fire Gemini calls the moment the server restarts, which may conflict with users if a deploy happens during peak hours
   - *Mitigation*: Consider deploying during off-peak hours (2–4 AM)

---

## Environment Variables Checklist

Variables to add before launch:

```env
# Admin Security
ADMIN_API_SECRET=<generate: openssl rand -hex 32>

# Rate Limiting (current values — keep as-is for now)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# For post-launch (after implementing I2)
RATE_LIMIT_FREE_AI_PER_HOUR=20
RATE_LIMIT_PRO_AI_PER_HOUR=200
```

---

## Todo List

### ✅ Before Launch (This Week — ~2 hours total)
- [ ] **C1**: Create `src/middleware/adminKeyAuth.ts` (check `X-Admin-Key` header)
- [ ] **C1**: Update `src/index.ts` — exclude `/api/admin/` from global IP limiter
- [ ] **C1**: Update `src/routes/adminRoutes.ts` — apply `adminKeyAuth` middleware
- [ ] **C1**: Update frontend `src/lib/services/dashboardService.ts` — send admin key header
- [ ] **C1**: Generate and add `ADMIN_API_SECRET` to production `.env`
- [ ] **C2**: Add `authLimiter` (5 req / 15 min) to `src/index.ts`
- [ ] **C2**: Apply `authLimiter` to login and register in `src/routes/authRoutes.ts`
- [ ] **C3**: Change polling interval in `src/app/dashboard/page.tsx` (60s → 5 min)
- [ ] **C3**: Add `visibilitychange` guard to `DiscoveryFeed.tsx` polling

### 🟡 Post-Launch Week 2–3
- [ ] **I1**: Add `keyGenerator` to rate limiter using `req.user?.id` instead of IP
- [ ] **I1**: Reorder middleware in `src/index.ts` so auth runs before rate limiter
- [ ] **I2**: Create `src/middleware/tierRateLimit.ts`
- [ ] **I2**: Apply tier rate limit to `/api/chat/*` and `/api/analysis/*`
- [ ] **I4**: Move `startScheduler()` from `src/index.ts` to `src/worker.ts`

### 🟡 Post-Launch Week 3–4
- [ ] **I3**: Create `src/middleware/cacheMiddleware.ts` with TTL cache
- [ ] **I3**: Apply to character and game GET routes
- [ ] **Non-rate-limit**: Increase MongoDB pool size to 50 in `src/config/database.ts`
- [ ] **Non-rate-limit**: Check and request Gemini quota increase on Google Cloud console

### 🟢 Future (10k+ Users)
- [ ] **F1**: Migrate to Redis-backed rate limiting (`rate-limit-redis`)
- [ ] **F2**: Set up Cloudflare in front of EC2
- [ ] **F3**: Evaluate API Gateway

---

*Generated: 2026-05-05 | Target launch: Week of 2026-05-12*
