# Cheese on Toast — Launch Copy

> Ready-to-paste posts for your soft-launch week. Personalise the **[ITALICS]** bits.
> Production URL: **https://toasted-cheese-map.emergent.host**

---

## 1. Reddit Posts

### Post A — `r/cookingforbeginners` or `r/cooking`

**Title:**
> I built a kitchen simulator for teenagers because mine kept burning the grill (free, no signup)

**Body:**
> My teenager set off the smoke alarm three times in two weeks making cheese on toast. So I built them a little simulator — a brutalist arcade game where you put bread in a toaster, melt cheese under the grill, and try not to nuke the kitchen.
>
> Sounds stupid but it actually works. They've gone from "what's a grill" to making their own dinner.
>
> Free, no signup, runs in any browser. Three sims so far: cheese on toast, boiled rice (the lid stays on, please), and saucepan heating (stir or burn).
>
> 👉 https://toasted-cheese-map.emergent.host
>
> Built it solo as an Aussie dad. Mainly want feedback — is it too easy? Too cringe? Missing any obvious recipe?

**Why this works:** Self-deprecating, specific (3 alarms in 2 weeks), invites criticism = high engagement. Don't add "PLEASE UPVOTE" — kiss of death.

---

### Post B — `r/melbourne` / `r/sydney` / `r/brisbane` (pick whichever you have a personal connection to)

**Title:**
> Aussie dad built a free cooking app for teenagers. Looking for kids aged 13-17 to break it.

**Body:**
> Hi all. I'm in *[Toowoomba / wherever]*. Made a little browser game that teaches teens how to actually use a kitchen — bread in toaster, cheese under grill, that kind of thing.
>
> It's free, made-in-Australia, no ads, no data harvesting (Privacy Act compliant, ABN listed and everything). Premium tier exists if you want fancier recipe collections but the whole core thing is free forever.
>
> If you've got a 13-17yo who eats only chips, point them at this and let me know what breaks. https://toasted-cheese-map.emergent.host
>
> Cheers.

**Why this works:** Trust signals (ABN, Privacy Act, no ads), local angle (Aussie subs love supporting locals), call for bug reports = user research disguised as launch.

---

### Post C — `r/IndieDev` or `r/SideProject`

**Title:**
> Solo-built a PWA cooking simulator with Stripe + Web Push in 3 weeks. AMA / roast my landing page.

**Body:**
> Tech: React + FastAPI + MongoDB + Stripe (AUD) + Resend + VAPID push. PWA, installable, mobile-first.
> Built for teens who can't cook. Three interactive simulators, achievements, streak counter, theme unlocks, free trial + monthly + lifetime.
>
> https://toasted-cheese-map.emergent.host
>
> Stack questions, conversion-rate critique, copywriting roast — all welcome.

**Why this works:** IndieDev/SideProject communities love technical depth + open critique. Free QA + UX feedback.

---

## 2. TikTok / Instagram Reels Scripts

### Script A — "The Disaster" (15 seconds, no voiceover needed)

**Visual:**
1. (0–3s) Open the cheese-on-toast simulator. Text overlay: *"Built a game where you cook cheese on toast"*
2. (3–6s) Tap through: bread → toaster → cheese → grill. Text: *"You have to time it right..."*
3. (6–11s) Let the timer run. Watch flames + smoke appear. Big text: *"OR ELSE"*
4. (11–13s) The 🔥 FIRE 🔥 outcome screen. Shake animation. Text: *"Yeah."*
5. (13–15s) Cut to text card on black: *"toasted-cheese-map.emergent.host"* + cheese emoji

**Caption:**
> i made a cooking game for teenagers who can't cook. yes the kitchen explodes 🧀🔥
> #cookingforteens #cheeseontoast #ausdev #indiedev #pwa #cookingfail

**Music:** Anything with a sudden drop. Search trending sounds for "disaster" or "explosion" on TikTok.

---

### Script B — "Speedrun" (10 seconds)

**Visual:**
1. (0–2s) Hands holding phone. Text: *"Cheese on toast speedrun"*
2. (2–8s) Rapid finger taps through all 5 stages of the sim. Show timer ticking up to PERFECT
3. (8–10s) PERFECT! result screen. Text: *"new pb 🏆"*

**Caption:**
> any/all teens stuck inside on a sunday: https://toasted-cheese-map.emergent.host
> #speedrun #cooking #gamified

---

## 3. Facebook / Aussie Parent Groups

**For groups like "Aussie Mums Online", "Parents of Teenagers Australia", local school P&C groups:**

> **Hi everyone — Aussie dad in *[Toowoomba]* here.** Wanted to share something I built. My teenager is *legendary* at burning food. So I made a little phone-friendly cooking app that lets them practise on a simulator before they touch the real kitchen.
>
> ✅ Free (premium tier exists but everything important is free)
> ✅ No ads, no data sold
> ✅ Built and hosted in Australia, ABN listed, Privacy Act compliant
> ✅ Works on any phone — no App Store needed, just open the link
> ✅ Designed for ages 13-17
>
> https://toasted-cheese-map.emergent.host
>
> If your kid tries it, I'd love to hear what they thought (especially what they hated — that's how it gets better). DM me if you find anything broken. Cheers 🧀

**Key:** Don't sell. Tell a story. Sign off with your name. Don't post the same copy in 10 groups same day — Facebook's algo flags spam.

---

## 4. Email Pitch to Home-Ec Teachers

**Subject:** Free cooking simulator for teens — built it for my own kid

**Body:**
> Hi *[teacher name]*,
>
> I built a free browser-based cooking simulator for teenagers — visual, interactive, designed to teach basic kitchen skills (cheese on toast, boiled rice, saucepan safety) before students touch a real stovetop.
>
> No login needed, no ads, no personal data collected. Made in Australia, ABN-registered, Privacy Act compliant.
>
> If it would be useful in your classroom I'm happy to provide free lifetime premium codes for your students. Would love your feedback either way.
>
> https://toasted-cheese-map.emergent.host
>
> Cheers,
> *John*

---

## 5. Pinned tweet / X post

> Built a cooking simulator for teenagers who can't cook. You make cheese on toast in a brutalist arcade game. Time it right or the kitchen catches fire 🧀🔥
>
> Free. No signup. Aussie-made.
>
> https://toasted-cheese-map.emergent.host

---

## Posting Schedule (suggested)

| Day | Channel | Why |
|---|---|---|
| Mon morning | r/cookingforbeginners (Post A) | Reddit weekly traffic peaks Mon-Wed |
| Tue evening | TikTok (Script A) | After-school audience |
| Wed | r/IndieDev (Post C) | Indie audience converts well to feedback |
| Thu | Facebook parent group #1 | Aus parents browse FB at night |
| Fri | r/melbourne or local sub (Post B) | Local weekend reading |
| Sat | TikTok (Script B) | Weekend scroll |
| Sun | Email 5 home-ec teachers | Teachers do admin Sunday night |

## What to track

Open Stripe + your Plausible analytics + the `analytics_events` MongoDB collection after each post:

- **Visitors** — from which source
- **Sandbox plays** — did people try the sim?
- **Trial signups** — % of visitors who started trial
- **Purchases** — % of trials that converted (track 3 days later)

If a channel sends >50 visitors but <2 sandbox plays → your landing page isn't selling the sim enough.
If sandbox plays are high but trials are low → paywall timing/copy is off.

---

## DO NOT

- ❌ Post the exact same copy in 5 subs same day (Reddit shadowbans this)
- ❌ Reply to every comment with "buy premium 🔥🔥🔥" (kills threads)
- ❌ Use AI-generated TikTok voiceover for the first 3 videos — feels generic
- ❌ Argue with critics. Thank them and use their words to improve.
- ❌ Run paid ads until at least 100 organic users have used the sim (you don't know what converts yet)

---

Good luck. Report back in 7 days. 🧀
