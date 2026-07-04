# 🧀 Cheese on Toast

**A brutalist kitchen simulator for teenagers who can't cook.**

Time it right → PERFECT. Time it wrong → 🔥 fire. Then read the real recipe.

**Live app:** https://toasted-cheese-map.emergent.host

![Cheese on Toast — home screen](https://static.prod-images.emergentagent.com/jobs/095313e1-c866-46da-b6f8-9627abf19281/images/559651262da6b6a1ec6350987a71bcb9d257570ecb489bcc6bf13af421ab4988.png)

---

## The pitch

Most cooking apps treat you like a Michelin chef. This one assumes you're 14, you've never melted cheese before, and you'd quite like *not* to set the grill on fire.

You play a **5-stage arcade simulator** on a glowing CRT screen with retro beeps. Bread → toaster → cheese → grill → take it out. Get it right, unlock badges. Get it wrong, watch your virtual kitchen catch fire. Then flip to the real recipe.

Built solo in Australia, for actual Australian teens (and the parents keeping the smoke alarm working).

---

## Who it's for

| Persona | Why |
|---|---|
| **Teens (13–18)** | Primary user. Googled "how to make cheese on toast" at 11pm, hungry, alone |
| **Parents of teens** | Premium buyer. Peace of mind the kid won't burn the house down |
| **Uni students** | Moving-out survival. Budget meals, basic technique |

---

## What's inside

- 🎮 **3 interactive cooking simulators** — cheese-on-toast, boiled rice, saucepan heating
- 📖 **8 free recipes** with AI-illustrated photos
- 🏆 **11 achievements** including perfect-streak badges
- 🎨 **6 kitchen themes** — earn 5 by playing, 1 free
- 💳 **Freemium** — A$3.99/mo or A$24.99 lifetime unlocks 10 premium collections
- 🔔 **Real Web Push** notifications (streak reminders every 3+ days)
- 📱 **Installable PWA** — no App Store required
- 🇦🇺 **Aussie-made** — ABN listed, Privacy Act compliant, AUD pricing

---

## The stack (short version)

```
React 19 PWA  ─►  FastAPI  ─►  MongoDB
                    │
                    ├─►  Stripe (payments, AUD)
                    ├─►  Resend (magic-link email)
                    ├─►  Gemini (AI recipe images)
                    └─►  Web Push (VAPID)
```

Full breakdown: see [**STACK.md**](./STACK.md).

---

## Run it locally

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env         # fill in your keys
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install
yarn start                    # opens http://localhost:3000
```

You'll need free/dev tier accounts for:
- MongoDB (Atlas free tier or local Docker)
- Stripe (test mode)
- Resend (100 emails/day free)
- Google Gemini (via Emergent LLM key)

---

## Screenshots

| Home | Simulator | Achievements |
|---|---|---|
| Yellow/black brutalist arcade UI | 5-stage CRT-style cooking timer | Perfect-streak counter + badges |

*(Take live screenshots once you're ready to promote — the app is installable and looks best on a phone in the hand.)*

---

## What's live right now

- ✅ Real Stripe checkout accepting AUD (live mode)
- ✅ 3-day free trial, monthly + lifetime tiers
- ✅ Magic-link email sign-in (Resend)
- ✅ Web Push notifications with VAPID
- ✅ Google Analytics 4 + Plausible
- ✅ Privacy + Terms + Support pages (Aussie-compliant)
- ✅ Cloudflare CDN + auto TLS
- ✅ PWA installable on iOS 16.4+ / Android / desktop

---

## Roadmap

**Next up (P1):**
- Family Plan tier — A$49.99/year for up to 4 devices
- Custom domain (`cheeseontoast.app`)
- Real user testimonials once we have them
- Recipe submission from readers

**Later (P2):**
- Avatar / kitchen scene customisation
- Seasonal drops (Halloween, Christmas, BBQ)
- Multi-language i18n
- Native iOS / Android via Capacitor

**Full backlog:** see [`memory/PRD.md`](./memory/PRD.md).

---

## Built by

**John** — Toowoomba, QLD 🇦🇺
Cheese on Toast · ABN 82 097 590 964
Contact: [john.create@protonmail.com](mailto:john.create@protonmail.com)

---

## Licence

Source code is proprietary — all rights reserved. If you're interested in the recipe content, illustrations, or the simulator engine, get in touch.

---

*Practising cheese on toast so you don't burn the kitchen down since 2026.* 🔥
