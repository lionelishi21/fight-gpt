# MetaPunish — Product Roadmap

> Target: **$500K MRR** · The Bloomberg Terminal for fighting games.

---

## Priority Legend

| Level | Meaning |
|---|---|
| 🔴 P0 | Blocking revenue — fix before anything else |
| 🟠 P1 | Core retention — drives DAU and monthly stickiness |
| 🟡 P2 | Growth — users bring other users |
| 🔵 P3 | B2B — highest revenue per account |
| 🟢 P4 | Mobile experience |
| ⚙️ P5 | Platform health |

---

## Task Index

| # | Task | Priority | Status |
|---|---|---|---|
| 01 | [Fix Stripe payments](./01-stripe-fix.md) | 🔴 P0 | `server-side` |
| 02 | [Fix tier gate — /auth/me](./02-tier-gate.md) | 🔴 P0 | `todo` |
| 03 | [Push notifications](./03-push-notifications.md) | 🟠 P1 | `todo` |
| 04 | [Daily missions loop](./04-missions-loop.md) | 🟠 P1 | `todo` |
| 05 | [Rival Watch wiring](./05-rival-watch.md) | 🟠 P1 | `todo` |
| 06 | [Weekly meta brief cron](./06-weekly-brief-cron.md) | 🟠 P1 | `todo` |
| 07 | [Shareable analysis card](./07-share-card.md) | 🟡 P2 | `todo` |
| 08 | [Public character SEO pages](./08-character-seo.md) | 🟡 P2 | `todo` |
| 09 | [Referral flow in mobile](./09-referral-mobile.md) | 🟡 P2 | `todo` |
| 10 | [Org / B2B dashboard](./10-org-dashboard.md) | 🔵 P3 | `todo` |
| 11 | [API access tier](./11-api-tier.md) | 🔵 P3 | `todo` |
| 12 | [Offline frame data cache](./12-offline-cache.md) | 🟢 P4 | `todo` |
| 13 | [Quick lookup — mobile home](./13-quick-lookup.md) | 🟢 P4 | `todo` |
| 14 | [App Store submission](./14-app-store.md) | 🟢 P4 | `todo` |
| 15 | [AutoResearch visibility](./15-autoresearch-visibility.md) | ⚙️ P5 | `todo` |
| 16 | [GitHub Actions CI/CD](./16-cicd.md) | ⚙️ P5 | `todo` |
| 17 | [Sentry error monitoring](./17-sentry.md) | ⚙️ P5 | `todo` |

---

## Revenue Model

| Tier | Price | Monthly Limit | Target Users | MRR |
|---|---|---|---|---|
| Free | $0 | 3 analyses lifetime | — | — |
| Competitor | $25/mo | 30 analyses/month | 8,000 | $200K |
| Pro | $75/mo | 150 analyses/month | 1,500 | $112K |
| Esports Org | $2,000/mo | 500 analyses/month | 50 | $100K |
| Data API | $5,000/mo | Unlimited | 10 | $50K |

**Total target: $462K+ MRR**

---

## Cost Model (at $500K MRR)

| Item | Monthly Cost |
|---|---|
| Gemini 2.0 Flash (ingestion) | ~$450 |
| Gemini 2.5 Pro (user uploads) | ~$22,500 |
| EC2 cluster | ~$1,200 |
| MongoDB Atlas M50 | ~$1,100 |
| Redis | ~$400 |
| Resend + misc | ~$800 |
| FGC expert reviewers (5×) | ~$3,500 |
| **Total** | **~$30,000/mo** |
| **Gross margin** | **~94%** |
