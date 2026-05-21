# 01 · Fix Stripe Payments

**Priority:** 🔴 P0 — Revenue Blocker  
**Status:** Server-side env var missing  
**Effort:** 15 minutes  

---

## Problem

`PaymentService failed to initialize` appears in PM2 logs on every server restart.  
Nobody can upgrade to Competitor or Pro. Every upgrade attempt returns a 500 error.

---

## Fix

SSH into the EC2 server and add to `.env`:

```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Then reload:

```bash
pm2 reload fightgpt-api
pm2 logs fightgpt-api --lines 20   # confirm "PaymentService initialized"
```

---

## Stripe Webhook Setup

In Stripe Dashboard → Developers → Webhooks:

- Endpoint URL: `https://api.fightingames.online/api/payments/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

---

## What Triggers on Each Event

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `user.tier = 'COMPETITOR'` or `'PRO'` |
| `customer.subscription.updated` | Update tier on plan change |
| `customer.subscription.deleted` | Downgrade back to `'FREE'` |
| `invoice.payment_failed` | Send payment failed email (template 05 built) |

---

## Verification

After adding keys:
1. Go to `metapunish.com/pricing`
2. Click "Go Competitor"
3. Stripe checkout should open
4. Use test card `4242 4242 4242 4242` to confirm flow
