# Marketing — Department Playbook

**Mission:** feed the machine — predictable lead flow at or under target CPL, with creatives that survive compliance and forms that filter for intent.
**The number Marketing owns:** qualified leads/day at CPL ≤ plan (base: ₹80).
**Team:** media buyer (hiring, Week 1) + content/community (Yash) + automation (Abhishek) + editor. Founder (Rahul Sir) is the face — his time is scheduled, not requested.

## Assets on hand (verified)

- Meta ad account `5793…8211` (INR, active, MCP-connected) — **needs payment method + Page link on Day 1**. July's campaigns ran on a second account ("Account 2"); consolidate reporting wherever spend runs.
- Instagram: **@rahul_saraoge ≈ 15K followers** (the hero channel, currently <20 posts/month), @ctc_kanpur (community feeder), @_5_circles (dormant — relaunch as institute proof-of-results feed).
- ManyChat with keyword automations already defined: `COURSES`, `BROCHURE`, `BEAT`, `WEBINAR` (park `STRIDE` until SEBI gate clears).
- Full 35-posts/month content calendar already drafted in the social plan — **execution, not planning, is the gap** (1 of 29 items was "Ready").
- Canva Pro, CapCut/Premiere, Kling AI, Meta Pixel + GA.

## KPI table

| KPI | Target | Read when |
|---|---|---|
| CPL (7-day) | ≤ ₹80 base / ₹120 ceiling | Daily war room |
| Leads/day | Ramp: 30 → 60 → 120 by W4 | Daily |
| Junk-lead rate (wrong numbers, "no"-intent, non-India) | < 10% | Daily, from Sales feedback |
| ROAS (collected ÷ spend) | ≥ 3× | Weekly review |
| Creative velocity | 6 new ads/week | Weekly |
| Webinar registrations/day | ≥ plan for the week's webinars | Daily |
| Organic: @rahul_saraoge posts | 35/month per the calendar | Weekly |

## Campaign architecture (three campaigns, one job each)

1. **C1 — Local (Kanpur-40km):** batch enquiries for the offline engine. Multi-layer **verified** form (July's winner for quality). ~30% of budget.
2. **C2 — National webinar (Hindi):** registrations for the free live webinar with Rahul Sir → BEAT the Index flagship. Broad + interest stacks, 25–45. ~50% of budget.
3. **C3 — Retargeting:** IG engagers, video viewers, registrants who didn't attend (→ replay/next date), attendees who didn't buy (→ offer + deadline), site visitors. ~20% of budget. Build these audiences from Day 3 even while small.

## Form doctrine (July's test, applied)

July ran both styles: broad form ≈ 25 leads/day but meme names, junk emails, zero screening; verified 3-layer form ≈ 11 leads/day with bank employees and LIC agents in the list. **Default = verified multi-layer form**, plus:
- Intent question stays ("how soon"), and **"no"/blank answers auto-disqualify** — they never reach a closer's list.
- Phone validation on; non-Indian numbers (July had six +1 numbers) filtered in Make before the CRM.
- Every form maps `campaign / adset / ad / form` into `Lead_Log` so close-rates trace back to creatives.

## Creative system

- **Angle that already worked:** founder authority ("Rahul Sir VC" creative, 14 July). Double down: market-view clips, student results, classroom proof, "20 saal ka experience" framing.
- Batch production: one 3-hour shoot with Rahul Sir = 2 weeks of ad + organic footage. Book the first shoot in Week 0.
- 3 hooks × 2 formats (reel + static) weekly; kill and replace, never pause and pray.
- Testimonials arrive weekly from Operations (consented, on the release form). Real students, real names, no earnings claims.
- **Compliance pre-flight on every creative** (see `docs/COMPLIANCE.md`): no assured returns, no profit screenshots as typical results, risk disclaimer on landing pages, education framing only. One approver signs off; violations don't ship.

## Scaling rules (mechanical, not emotional)

- Test at ₹3–5k/day (W1). An ad that spends 2× target CPL with no lead → off.
- Ad ≤ ₹80 CPL with clean quality feedback → +20–30% budget/day, never more (learning-phase resets).
- Frequency > 2.5 on any audience → rotate creative.
- Scale only into rates that hold: CPL ≤ plan AND Sales confirming quality AND show-rate ≥ 30%. Otherwise spend freezes at last profitable level (recovery playbook, `ROADMAP.md §7`).

## Organic engine (free reach the ads compound on)

- Execute the existing calendar: @rahul_saraoge 35/month (15 educational, 10 market-view, 5 personal, 5 screen-share), stories 3–4×/week, comment replies < 2h, peak slots 8–9 am / 12–1 pm / 7–9 pm.
- @ctc_kanpur: 2–3 giveaways/month boosted ₹500–1,000 — local top-of-funnel.
- Every reel CTA → ManyChat keyword → webinar registration link. DMs are leads: they enter `Lead_Log` like everyone else.

## Interfaces

- **Gives Sales:** every lead in `Lead_Log` within 60 seconds (Make S1), tagged with source and intent answers.
- **Gives Finance:** the day's spend figure by 9 pm (scorecard line).
- **Gets from Sales:** daily quality verdict (junk %, which angle produced buyers) — in the war room, not in a someday report.
- **Gets from Operations:** 3 testimonial clips + results screenshots (consented) weekly.

## Week-1 checklist

1. Payment method + business verification + Page/IG linked on the ad account (Day 1).
2. Pixel + Conversions API firing: Lead, InitiateCheckout, Purchase — test events verified.
3. Landing page with disclaimer + verified lead form live; Make S1 filter chain tested.
4. First shoot with Rahul Sir done; batch 1 = 6 ads through compliance pre-flight.
5. C1 + C2 live at ₹3–5k/day combined; C3 audiences building.
6. Organic calendar restarted on @rahul_saraoge (first 7 posts scheduled).
