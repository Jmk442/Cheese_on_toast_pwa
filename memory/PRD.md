# PRD — How to Make Cheese on Toast

## Original Problem Statement
> "I want a mobile app... called how to make cheese on toast. I want other simple recipes for example fried rice sushi how to boil rice and something like no microwave no problem... It's for teens... so when teens Google 'how to make cheese on toast' this app would come up so I would like SEO sorted... I'd like a visual oven like a sandbox... 1 minute cheese start melt, 2 minutes looking good, 3 minutes should be about ready, 4 minutes take it out, 5 minutes oven on fire... nuclear explosion. Gamer vibe but not a game. Very simple to read but looking amazing to hold teen attention. Bread goes in the toaster, toast comes out, then cheese on toast — not cheese in toaster."

## User Personas
- **Primary**: Teens (13-18) Googling basic cooking — never cooked before, scared of burning things, need it to feel cool not patronising.
- **Secondary**: Parents/teachers pointing teens at it as a quick safe how-to.

## Core Requirements (Static)
1. Mobile-first responsive web app (installable, PWA manifest)
2. Strong SEO targeting "how to make cheese on toast" + Recipe JSON-LD
3. Flagship interactive **Cheese on Toast Sandbox** with 5-stage state machine + accelerated timer + disaster states (fire, nuclear)
4. 5 starter recipes: cheese on toast, boiled rice, fried rice, sushi hand rolls, no-microwave saucepan heating
5. Dark brutalist "arcade utility" aesthetic — Unbounded display + IBM Plex Mono body — yellow/red/blue/lime accents, no gradients
6. Bread→toaster→toast→cheese→grill sequence accuracy (never cheese in toaster)
7. data-testid on every interactive element

## What's Been Implemented (2026-02)
- **Frontend SPA** (React 19 + Tailwind + react-router 7) — no backend changes; recipes are static
- Pages: `/` Home, `/recipes` list, `/recipe/:slug` detail (**8 recipes**), `/simulator` flagship cheese-on-toast sandbox, `/simulator/boiled-rice` rice boil-dry meter, `/simulator/saucepan-heating` saucepan stir meter, `/achievements` badge gallery
- **Recipes**: cheese on toast (flagship), boiled rice, fried rice, sushi hand rolls, no-microwave saucepan heating, **scrambled eggs**, **simple pasta**, **beans on toast**
- **Cheese-on-toast sandbox**: 6 stages, 8 timer phases, accelerated time, outcome panel
- **Rice sandbox**: water-level gauge + heat dial. Outcomes: PERFECT / ALMOST / UNDERCOOKED / BURNT BOTTOM / PAN DESTROYED / BOILED OVER
- **Saucepan sandbox**: stick-meter + temp gauge with 80% sweet-zone marker. Outcomes: PERFECT / LUKEWARM / COLD / STUCK / BURNT / SCORCHED
- **Difficulty levels** (EASY / NORMAL / HARD): tick-rate multipliers applied across all 3 sims; HARD narrows perfect windows. Picker locks while sim is running.
- **Persistent achievements** (localStorage `cot.stats.v1`): 8 badges (First Perfect Toast, Golden Master, Rice Rookie, Rice Pro, Stir Pro, Chaos Merchant, Sandbox Tour, Iron Chef). In-app banner on unlock, dedicated `/achievements` page with grid + stats overview + reset.
- Home page strip linking to achievements showing `<n> of 8 unlocked`
- Header buttons: TROPHIES + SANDBOX
- Audio cues (Web Audio API beeps) with mute toggle
- **SEO**: static index.html with Recipe JSON-LD for flagship; dynamic SeoHead.jsx per-page; sitemap.xml lists all sims, recipes and achievements
- **PWA**: manifest.json, apple-mobile-web-app meta, theme-color #09090B
- Tested via testing agent: iter 1 (14/14), iter 2 (12/12), iter 3 (47/48) — single soft-fail was a test-timing issue on the entry-animating banner, not a bug

## Backlog (Future)
**P1 — High value enhancements**
- "Cooked it!" share button with auto-generated OG image (shareability → traffic loop)
- Voice narration of steps (hands-free while cooking)
- Unique illustrations / photos per recipe (currently scrambled-eggs/pasta share fried-rice asset; beans-on-toast shares cheese-toast)
- Dynamic phase labels in cheese sim that respect difficulty thresholds

**P2**
- More recipes (scrambled eggs, pasta, baked beans)
- Persistent "I made this" history (localStorage)
- Achievements / streaks (gamification without being a game)
- Real-time clock toggle (turn off accelerated time for full 5-minute live cook)

**P3**
- Server-side rendering for stronger SEO (Next.js migration)
- Recipe submission form + moderation
- Multi-language (the cheese-on-toast moment is universal)

## Next Action Items
1. Ship feedback round with user — confirm aesthetic + simulator difficulty curve
2. Add per-recipe rice/pan simulators (P1)
3. Add share-card image generation for organic growth
