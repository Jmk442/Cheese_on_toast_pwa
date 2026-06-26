# 🧀 Cheese on Toast — Tech Stack

**Live:** https://toasted-cheese-map.emergent.host
**Last updated:** 2026-06-01

A mobile-first PWA that teaches teenagers basic cooking via interactive simulators, recipe guides, and a paid premium tier (Stripe AUD). Built solo in Australia.

---

## 🎨 Frontend

| Layer | Tech |
|---|---|
| Framework | React 19 (Create React App + Craco) |
| Styling | TailwindCSS + custom CSS variables for theme swapping |
| UI Components | shadcn/ui + Lucide React icons |
| Routing | React Router v6 |
| State | React Context API (`PremiumContext`) |
| PWA | Web Manifest + custom Service Worker (`/sw.js`) |
| Offline storage | Browser `localStorage` (achievements, themes, saved recipes) |

## ⚙️ Backend

| Layer | Tech |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| Server | Uvicorn (managed by Supervisor) |
| Database | MongoDB (via Motor async driver) |
| Validation | Pydantic v2 |
| Internal scheduler | asyncio task (12h streak reminders, no external cron needed) |

## 💳 Payments

| Service | Use |
|---|---|
| Stripe Checkout | Subscription + one-off (AUD live mode) |
| Stripe Customer Portal | Self-serve cancel + manage |
| Stripe Webhooks | `checkout.session.completed` → grant premium |

## 📧 Email

| Service | Use |
|---|---|
| Resend | Magic-link sign-in emails |

## 🔔 Push Notifications

| Tech | Use |
|---|---|
| Web Push API | Native browser push (iOS 16.4+, Android, desktop) |
| VAPID | Self-signed crypto keypair (`pywebpush` + `py-vapid`) |
| Service Worker | Receives + displays notifications |

## 🤖 AI

| Service | Use |
|---|---|
| Google Gemini (Nano Banana) | One-shot AI illustrations on recipe pages |
| emergentintegrations | Universal LLM key wrapper |

## 📊 Analytics & SEO

| Tool | Use |
|---|---|
| Google Analytics 4 | Page views + events (with IP anonymisation) |
| Plausible Analytics | Cookie-less complement to GA4 |
| Recipe JSON-LD | Google rich results (schema.org/Recipe) |
| Open Graph + Twitter cards | Social link previews |
| sitemap.xml + robots.txt | Search Console indexing |

## ☁️ Infrastructure

| Layer | Provider |
|---|---|
| Hosting | Emergent (Kubernetes-managed) |
| Domain | `toasted-cheese-map.emergent.host` |
| TLS / HTTPS | Auto-provisioned by Emergent |
| CDN / WAF | Cloudflare (Emergent-managed) |
| Process supervision | supervisord (backend + frontend + mongo) |
| Database | MongoDB (managed in production) |

## 🔐 Auth

| Layer | Tech |
|---|---|
| Primary identity | Anonymous browser-generated device ID (UUID, localStorage) |
| Optional account upgrade | Email magic-link (no passwords) |
| Token storage | MongoDB `magic_links` collection with TTL index |

## 📦 Key Python Dependencies

```
fastapi, uvicorn, motor, pymongo, pydantic
stripe, resend, pywebpush, py-vapid
emergentintegrations (Emergent LLM wrapper)
python-jose, python-multipart, python-dotenv
```

## 📦 Key JS Dependencies

```
react, react-dom, react-router-dom
tailwindcss, @craco/craco
lucide-react (icons), sonner (toasts)
shadcn/ui primitives (button, dialog, etc.)
```

## 🇦🇺 Legal & Compliance

| Layer | Detail |
|---|---|
| Jurisdiction | Queensland, Australia (ABN 82 097 590 964) |
| Privacy | Privacy Act 1988 + Australian Privacy Principles |
| Consumer law | Australian Consumer Law (Comp & Consumer Act 2010) |
| Currency | AUD (Stripe in live mode) |
| GST | Inclusive in displayed prices |

## 💰 Monetisation

| Tier | Price | Mechanism |
|---|---|---|
| Free | $0 | All recipes + simulators |
| Trial | 3-day free | Auto-granted on first launch |
| Monthly | A$3.99 / month | Stripe subscription |
| Lifetime | A$24.99 one-off | Stripe payment |

## 🛠️ Dev Tooling

| Tool | Use |
|---|---|
| Git | Source control |
| ESLint | JavaScript linting |
| Ruff | Python linting |
| pytest | Backend tests (`/app/backend/tests/`) |

---

## 📊 System diagram

```
React + Tailwind PWA  ──────►  FastAPI  ──────►  MongoDB
       │                          │
       │                          ├──►  Stripe (payments)
       │                          ├──►  Resend (emails)
       │                          ├──►  Gemini (AI images)
       │                          └──►  Web Push (VAPID)
       │
       └──►  GA4 + Plausible (analytics)
```

---

## 🗂️ Repository Layout

```
/app/
├── backend/
│   ├── server.py             # FastAPI app, all endpoints
│   ├── requirements.txt
│   ├── .env                  # MONGO_URL, STRIPE_*, RESEND_API_KEY, VAPID_*
│   ├── scripts/              # gen_recipe_images.py
│   └── tests/                # pytest suites
└── frontend/
    ├── public/
    │   ├── index.html        # GA4 + Plausible + meta + JSON-LD
    │   ├── manifest.json
    │   ├── robots.txt
    │   ├── sitemap.xml
    │   ├── sw.js             # Service worker (push notifications)
    │   └── img/              # AI-generated recipe images
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js            # Router
        ├── index.css         # Tailwind + theme variables
        ├── components/       # Shared UI (ShareButton, PaywallTrigger, etc.)
        ├── context/          # PremiumContext (auth + premium state)
        ├── data/             # recipes.js, collections.js
        ├── lib/              # api.js, push.js, achievements.js, themes.js
        └── pages/            # Home, Simulator, Settings, Paywall, Legal, Support
```

---

## 🔑 Environment Variables (production)

Set via Emergent platform secrets — never committed.

| Variable | Where it lives | Purpose |
|---|---|---|
| `MONGO_URL` | backend | MongoDB connection string |
| `DB_NAME` | backend | Database name |
| `CORS_ORIGINS` | backend | `*` (locked to production domain via Cloudflare) |
| `EMERGENT_LLM_KEY` | backend | Gemini / OpenAI / Claude universal key |
| `STRIPE_API_KEY` | backend | Live secret key (`sk_live_...` or `rk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | backend | `whsec_...` for signature verification |
| `STRIPE_MONTHLY_PRICE_ID` | backend | `price_...` for A$3.99/mo |
| `STRIPE_LIFETIME_PRICE_ID` | backend | `price_...` for A$24.99 |
| `RESEND_API_KEY` | backend | Magic-link email sender |
| `VAPID_PUBLIC_KEY` | backend | Web Push public key (also sent to browsers) |
| `VAPID_PRIVATE_KEY` | backend | Web Push private key (server-only) |
| `VAPID_SUBJECT` | backend | `mailto:` contact for push provider abuse reports |
| `CRON_SECRET` | backend | Header check for `/api/push/send-streak-reminders` |
| `REACT_APP_BACKEND_URL` | frontend | Public API base URL |

GA4 Measurement ID (`G-76DB751FH3`) is in `frontend/public/index.html` — **not a secret**, intentionally public.

---

## 📊 Key API Endpoints

| Endpoint | Use |
|---|---|
| `POST /api/users/init` | Create / fetch device record + grant 3-day trial |
| `GET /api/users/{device_id}/premium` | Current premium status |
| `POST /api/checkout/session` | Start Stripe Checkout |
| `GET /api/checkout/status/{session_id}` | Poll after redirect |
| `POST /api/webhook/stripe` | Stripe → server (grant premium) |
| `POST /api/auth/magic-link/request` | Send magic-link email |
| `POST /api/auth/magic-link/verify` | Consume token → link device to email |
| `GET /api/account/me` | Account summary |
| `POST /api/push/subscribe` | Store browser push subscription |
| `POST /api/push/send-streak-reminders` | Cron (called externally OR internally every 12h) |
| `POST /api/analytics/event` | Server-side analytics events |
| `GET /api/health/email` | Resend configuration check |

---

## 🧪 Testing

- **Backend pytest**: `/app/backend/tests/`
- **Frontend smoke + flow tests**: run via the testing agent (`/app/test_reports/iteration_*.json`)
- **Manual E2E**: trial signup → simulator → /premium → Stripe → webhook → premium granted

---

## 📈 KPIs to watch

| Metric | Where | Healthy signal |
|---|---|---|
| New visitors | GA4 Realtime | >50/day after a Reddit post |
| /simulator share of traffic | Plausible Top Pages | >40% of total |
| Trial start rate | Stripe Dashboard | >5% of /premium page visitors |
| Trial→paid conversion | Stripe Dashboard (3 days later) | >10% of trials |
| Push subscriptions | `db.push_subscriptions.count()` | growing weekly |
| Streak reminder CTR | GA4 events `streak_reminder_*` | >15% CTA click rate |
