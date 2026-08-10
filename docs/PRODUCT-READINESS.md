# Product Readiness, Analysis & Back-Testing Protocol

**The rule this document exists to enforce:** for every SKU on the Day-1 price list there is written, independently-verified evidence that *what the closer promises is what the buyer actually receives*. Every SKU without that evidence is removed from the list rather than launched with a disclaimer.

Two completely different disciplines are involved, and confusing them is how firms get into trouble. Education products are validated by **delivery acceptance testing** then a **full-price pilot**. The signal engine is validated by a **back-test that is honest about its own biases**, then a **forward paper-trading period nobody is permitted to edit**.

---

## Part A — Building the ladder in fifteen days

### What ships on Day 1

**P1 Market Foundation Course (₹1,999).** Modules 1–3, ≥3.0 finished hours, in **Hinglish** — Hindi delivery with English terminology, which is how Rahul already teaches and how the market already speaks. Modules 4–8 ship on a published, dated release calendar inside the 30-day doubt-group window, stated on the sales page *and* in the Module-1 welcome.

> **The claim changes, and the script changes with it.** Not "eight to ten hours available now" but "lifetime access, full curriculum released on this dated calendar, first three modules today." A closer who says the first version has mis-sold, and the refund arrives in week three.

A truly bilingual 8–10 hour course means 16–20 hours of finished runtime. Rahul has ~5 spare hours a week and is the only credible face. It does not fit, and pretending it does produces refunds.

**P1b Sector Playbook Pack (+₹499).** Four sector playbooks as PDFs — how the sector earns money, what drives it, what to read. Named stocks appear only as concept illustrations, with no view, no target, and an explicit not-a-recommendation line. Requires dated CO confirmation (gate G-P1B).

**P0 Seven-day drip (free).** Seven 90-second clips recorded in one block. All seven carry an M6 pre-flight approval record. The Day-7 CTA creates a lead row routed to Desk A.

**P4a City Workshop (₹9,999).** Kanpur only, the company's own classroom — zero venue cost and near-zero cancellation risk. 40-seat cap, published 6.5-hour curriculum, one dated cohort 4–6 weeks out, published education refund terms. A cancelled workshop with paid seats is simultaneously a refund event, a reputation event and a gateway-dispute event; the second city is decided at Day 30 on real demand, not optimism.

### What is conditional

**Scanner Lite (₹499/mo, ₹4,999/yr).** Minimum shippable version: **end-of-day only**, Nifty 500 + F&O universe, ≥10 condition primitives, up to 5 AND-combined conditions, 3 saved screens on the monthly plan, next-morning digest delivery. Intraday and live streaming are an order of magnitude beyond this and there is one contract engineer with about ten days.

> Say **"end-of-day screener"** explicitly on the sales page and in the Desk A attach script. Nobody should buy expecting live ticks and then refund.

Go/no-go is **T-5 (Fri 21 Aug)**, deliberately four days before launch, so a no-go means the SKU comes off the price list with time to re-brief the floor — not on launch morning.

### What is deferred, and when it opens

| SKU | Why it cannot launch | When it opens |
|---|---|---|
| **Scanner Pro** (₹14,999) and **Research Subscription** (₹24,999) — ~₹8L/month of plan | Five independent blockers, any one sufficient: no named SEBI-qualified analyst; no named Compliance Officer; no back-test evidence; no forward paper record; algo-framework question unanswered | When gate G-PRO passes in full. Realistically Day 20–30 at the earliest |
| **Mentorship** (₹74,999) — ₹2.25L/month | Invite-only to P1 buyers who do not exist until ~Day 30. And the faculty arithmetic fails: 12 seats needs ~8h/week of a founder who has 5 | Outline and 6-seat cap built now; intake opens Day 45, cohort starts ~Day 60 |
| Workshops outside Kanpur | Venue contracting, travel and founder calendar all unsolved | Decided at Day 30 on real demand |
| Mobile app, API access, second course language | No builder, no spec, no day in the window | Not mentioned anywhere — an implied roadmap is a promise a closer will eventually repeat |

Six seats at ₹74,999 is ₹4.5L per cohort — **a smaller real product rather than a larger imaginary one.**

---

## Part B — Validating education products

Education is not validated by asking whether people bought it. It is validated by whether they can *use* it.

**Acceptance testing (gate G-P1).** Two independent real-money purchases, made by people who built none of it — Sanya and a senior floor counsellor — on a **₹9,000-class Android over 4G**, not on the team's phones. The full chain must work: payment succeeds → GST invoice on the correct series → Rigi access within 15 minutes → doubt group joined → Module 1 plays at 720p without buffering → comprehension quiz submits. Test #1 at T-4, defect closure at T-3, clean re-test at T-2.

> The course that "works" on a flagship and buffers on a buyer's phone is the refund driver nobody predicts.

**Pilot cohort validation.** 30 buyers at **full price**. Never a discounted pilot — a discount tells you nothing about willingness to pay, and price A/B testing is impossible anyway because the price book is locked. Measure: completion rate by module, comprehension scores, the module where drop-off happens, and refund-driver interviews with every refunder. What you are testing is whether the *promise* matches the *delivery*, not whether the price is right.

**Pitch testing** happens on live calls against the QA rubric, not in a spreadsheet: which opening produces connects, which objection kills the call, which explanation makes the product land.

---

## Part C — Back-testing the signal engine

This is the part that decides whether the ₹8L/month research line is a real business or a liability. It is written to be run under revenue pressure, because that is when firms fool themselves.

### C.1 Data requirements

The back-test is only as honest as the data underneath it.

- **Split- and bonus-adjusted OHLCV**, with a corporate-actions file. Validate by spot-check, never by trust: confirm **10 known corporate actions** are correctly adjusted before running anything.
- **Point-in-time index constituents.** Testing today's Nifty 500 over three years of history tests a universe selected *because* it survived. That is survivorship bias, and it manufactures profits that never existed.
- **Delisted names retained.** A universe that quietly drops failures is a universe that cannot lose money.
- **Liquidity filters** applied as of the trade date, not today — a stock that is liquid now may have been untradeable then.

### C.2 Method

- **No look-ahead.** Signals are generated from data available strictly before the fill. Fills occur at the **next session's open**, never at the close of the bar that generated the signal.
- **In-sample / out-of-sample split**, with the out-of-sample block **opened exactly once**, after the rule is pre-registered.
- **Walk-forward folds** rather than a single split, so the rule is tested across regimes rather than one lucky window.
- **A dated, realistic Indian cost model**: brokerage, STT, exchange charges, GST on charges, stamp duty, plus slippage and market impact sized to the instrument's actual traded volume. A strategy that only works at zero cost does not work.
- **The N-trials research log.** Every variant tried, dated, with its result. If forty rules were tested and the best one looks good, that is what forty attempts look like under randomness — and the log is the only thing that tells you so honestly.

### C.3 Metrics that matter

Hit rate alone is marketing, not evidence. Report all of: **hit rate; average win versus average loss; net expectancy per trade after costs; maximum drawdown; exposure; turnover; time-to-target and time-to-stop-loss distributions.** A 70% hit rate with a negative expectancy is a losing system that feels like a winning one.

### C.4 Pre-registration, and the forward test

**Pre-registration (gate G-BT, T-2).** Before any out-of-sample data is touched: parameters frozen, the rule file **hashed**, the complete N-trials log attached, and the whole thing **witnessed** by Rahul with a date. This is the single control that prevents the rule being quietly tuned until the out-of-sample block agrees with it.

**Forward paper-trading (starts T-13, permanently).** Signals written to an **edit-locked, append-only log in a restricted folder, timestamped before market open, every trading session.** Integrity checks confirm zero retro-edits in version history. Starting at T-13 means the 30-session clock is nearly complete by Day 15 — which is why this is the highest-value thing the product domain produces in the whole window.

### C.5 The launch thresholds, published in advance

Scanner Pro and the Research Subscription may not be sold until **all** of the following are true:

1. **≥100 closed out-of-sample trades** across **≥30 instruments** over **≥18 months**
2. **Net expectancy per trade positive after the full cost model**
3. **≥30 sessions** of unedited forward paper log
4. A **named SEBI-qualified registered analyst** on record
5. A **named Compliance Officer** with written classification confirmation
6. The **algo-framework question answered in writing** by counsel

Thresholds are published **before** results exist, so they cannot be renegotiated afterwards. If the evidence does not meet them, the SKU does not launch — that is the entire point of writing them down early.

---

## Part D — What back-test results may and may not be used for

**This is the highest-risk item in the product plan, and the rule is absolute.**

Back-test and forward-test results are **internal validation evidence and research rationale**. They are **not marketing**.

**Never:**
- In an advertisement, hook, thumbnail, landing page or creative of any kind
- In a sales script, a WhatsApp follow-up, or anything a closer says on a call
- In a testimonial, a case study, or a social post
- As any figure resembling a return, a win rate, or a performance claim to a prospect

Performance and return claims are banned in advertising under the RA Advertisement Code, and a back-tested number is still a performance claim. A hypothetical one is arguably worse, because it describes profits nobody actually made.

**Where results may legitimately appear** — subject to the Compliance Officer's written confirmation of the format, disclosures and hypothetical-performance treatment before first use:
- Inside the internal research process documentation
- In the analyst's own methodology record supporting a recommendation
- In whatever client-facing disclosure format the CO explicitly approves for existing, onboarded research clients

**When in doubt, the answer is no, and the CO decides — not the marketer, not the closer, and not the founder under revenue pressure at Day 45.** Route it to the CO in writing and wait.

---

## Part E — Acceptance gates summary

| Gate | Product | Blocks Day 1? |
|---|---|---|
| **G-P1** | P1 course deliverable exactly as sold, proven by two real-money purchases on a budget Android | **Yes** |
| **G-LIST** | Day-1 price list contains only gate-passed SKUs; deferred SKUs absent from every script, page and payment link | **Yes** |
| **G-SEG** | Education and research surfaces separate — separate domain, login and books | **Yes** |
| **G-LITE** | Scanner Lite is a tool: raw API payload contains zero keys named action, entry, stoploss, target or any view-bearing score | No |
| **G-P1B** | Playbook pack contains no securities recommendation (dated CO confirmation) | No |
| **G-P0** | Seven-day drip delivers on schedule, all assets pre-flight approved | No |
| **G-P4A** | Workshop is dated, venued, capped, with a live test booking | No |
| **G-BT** | Back-test integrity discipline in place *before* any out-of-sample access | No |
| **G-PRO** | Research line sellable — **expected to fail at T-1, deliberately, and recorded as failed with evidence** | No |

G-LITE's test is worth restating because it is the whole education-versus-research distinction made mechanical: **a person who did not build it composes a screen from ≥10 primitives, saves it, and receives the correct alert next session — and a raw API dump contains no recommendation fields at all.** Verified in the payload, not the UI. Hiding a field in the interface is not separation; removing it from the response is.

---

*Operating policy, not legal advice. Every regulatory specific must be confirmed against current SEBI circulars by the Compliance Officer. See [`PRELAUNCH.md`](PRELAUNCH.md) for the full runway and [`.claude/skills/sebi-ra-compliance/SKILL.md`](../.claude/skills/sebi-ra-compliance/SKILL.md) for the standing rules.*
