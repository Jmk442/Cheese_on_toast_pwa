# PRD — How to Make Cheese on Toast

## Original Problem Statement
A mobile-first teen cooking guide centred on "how to make cheese on toast" with simple recipes (rice, sushi, no-microwave heating, eggs, pasta, beans), a flagship interactive oven sandbox, gamer-vibe aesthetic, deep SEO, persistent achievements, share-cards, and a full premium subscription business model in AUD.

## User Personas
- **Teens (13-18)** Googling basic cooking — primary user. Wants fast, cool, judgement-free.
- **Parents** of teens — premium buyer. Wants peace of mind that the kid won't burn the house down or live on takeaway.
- **University students** — secondary teen extension. Budget meals, moving-out survival.

## Core Requirements (Static)
1. Mobile-first responsive web app (PWA-installable)
2. Strong SEO targeting "how to make cheese on toast" + Recipe JSON-LD per page
3. Three interactive sandboxes (cheese, rice, saucepan) with difficulty levels + achievements + share-cards
4. Premium subscription (3-day trial → A$3.99/mo OR A$24.99 lifetime, AUD)
5. Anonymous device-id identity, no signup friction
6. Multiple paywall triggers (first-launch, interruption, achievement-unlock, content-gate, lifetime upsell)
7. Brutalist arcade aesthetic — Unbounded display + IBM Plex Mono body
8. data-testid on every interactive element

## What's Been Implemented (2026-02)
### Free tier
- 8 free recipes (cheese on toast flagship, boiled rice, fried rice, sushi, no-microwave saucepan, scrambled eggs, simple pasta, beans on toast) with unique AI-illustrated images via Gemini Nano Banana
- 3 sandboxes (cheese, rice, saucepan) with state machines + difficulty (EASY/NORMAL/HARD) + accelerated timers + outcome cards + audio cues
- 8 achievements with localStorage persistence + dedicated page + in-app unlock banners
- Share-card system (Canvas-generated 1200×630 PNG with referrer attribution via `?via=`)
- SEO: index.html with Recipe JSON-LD; dynamic SeoHead per page; sitemap + robots
- PWA manifest

### Premium tier
- **Backend (FastAPI + MongoDB + Stripe test-mode AUD)**:
  - Free 3-day trial auto-granted on first init
  - Stripe Checkout: A$3.99/30days (monthly) + A$24.99/forever (lifetime)
  - Anonymous device-id identity primary; **email magic-link auth** as optional sync layer (`/api/auth/magic-link/request`, `/verify`, `/account/me`, `/account/unlink`)
  - When a device links to an email account, premium is resolved from the account so it transfers across all linked devices
  - Stripe purchases by a linked device grant to the **account**, benefitting every device on it
  - Dev-mode magic-link fallback (`dev_link` in response) active when `RESEND_API_KEY` is not configured — MUST be set before public deploy
  - Collections: `users`, `accounts`, `magic_links`, `payment_transactions`, `analytics_events`, `referrals`
- **Frontend premium architecture**: `PremiumProvider`, `PremiumGate`, `PaywallTrigger` (3 strategies), `Paywall`, `PaywallSuccess`, 10 collection pages, `MealPlan`, `GroceryList`, `SavedRecipes`, `Settings`, `AuthVerify`, `AccountLinkCard`
- **Cosmetic themes** (Yellow free, Neon/Mint/Slime premium) — instantly re-skin every brand surface via `data-cot-theme` + CSS custom properties
- **All pricing in AUD**
- **Tested**: iter 1 (14/14), iter 2 (12/12), iter 3 (47/48), iter 4 (12/12), iter 5 (backend 12/12, frontend 95%), iter 6 (backend 12/12, frontend ✓, UX bug found & fixed)

### Recent fix
- Mobile bottom-nav was overlapping stage-5 sim button — `Layout.jsx pb-28 → pb-36`. Verified click now lands correctly, outcome renders, URL stays /simulator.

## Backlog (Future)
**P0 — Pre-public-deploy hardening (must do before exposing to real users)**
- Set `RESEND_API_KEY` env var to disable the dev-mode magic-link response (currently anyone can request a token for any email and read it back via the API). Optionally gate behind an explicit `ALLOW_DEV_MAGIC_LINK=1` flag.
- Add unique MongoDB indexes: `magic_links.token`, `accounts.email`. TTL index on `magic_links.expires_at`.
- Add rate-limiting on `/api/auth/magic-link/request` (per-device + per-email throttle)
- Split server.py into modular files (auth.py, payments.py, analytics.py) once it crosses ~800 lines

**P1 — High value**
- Real push notifications (Web Push + VAPID + service worker) + email newsletter (Resend / Mailchimp)
- Family Plan tier (A$49.99/year covers 4 device-ids)
- Wire `PREMIUM_BADGES` into `/achievements` more visibly (currently shown but locked behind premium gate)

**P2**
- Avatar / kitchen scene customisation (currently theme only)
- Seasonal content drops (Halloween, Christmas placeholders exist)
- Multi-language i18n
- Server-side rendering (Next.js) for stronger SEO
- Per-recipe AI-generated illustrations for the 30+ collection recipes (currently text-only inside collections)

**P3**
- Recipe submission + moderation
- iOS / Android native shells (Capacitor)
- Refactor server.py into routers (auth/stripe/premium) — non-blocking
- Affiliate program launch (currently placeholder)

## What's New This Iteration (2026-02 — Streak + Theme Loop)
- **Streak counter** added to `lib/achievements.js`: `currentStreak` + `bestStreak` per sim, persisted in localStorage. Any non-perfect outcome resets the streak. Three new badges: `streak-3` (Hot Streak), `streak-5` (On Fire), `streak-10` (Unbreakable). Total badges now 11 (was 8).
- **Streak HUD** rendered in the top-right of every simulator (Cheese, Rice, Saucepan) with a flame icon, current streak number, and a tooltip showing best streak.
- **Streak overview section** on `/achievements` shows current + best per sim with red flame when ≥3.
- **Theme-as-reward** via new `lib/themes.js`: every paid theme has an explicit `unlock.badge` requirement, AND premium still unlocks them all. Locked themes show a lock-icon overlay and the achievement hint text in `/settings`.
- **Two new themes** added: `inferno` (red, unlocked by `streak-5`) and `arcade` (cyan, unlocked by `iron-chef`). CSS variables in `index.css`.
- **Tested**: iter 8 frontend testing agent 100% pass (9/9 groups verified).

## Next Action Items
1. Real push notifications (Web Push + VAPID + service worker) — P1
2. Family Plan tier A$49.99/year (4 device limit per account) — P1
3. Email newsletter integration (Resend already wired for magic-links; reuse for digest)

