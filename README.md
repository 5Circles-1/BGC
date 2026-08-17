# BGC — 5 Circles Business Growth Center

The operating system for the 60-day sprint to **₹25,00,000/month collections** (11 Aug → 9 Oct 2026) for 5 Circles Private Limited, SEBI-registered Research Analyst (INH000020004 — verify in writing Day 1).

## The instrument: OPERATOR v2

**Open [`portal/index.html`](portal/index.html) in any browser.** It opens on **The Business** — the founder's cockpit: what business we have done, where we are on the scaling map, every department's health in one line, which departments are in trouble and what the action is, and — the part that matters when the founder is the bottleneck — **what needs him and what does not**. Alongside it: the **Morning Brief** (the 08:45 artifact the huddle runs on), **Departments** (health plus the ideas board), and **Meetings** (war room, WBR and checkpoints run in the tool, scored on decisions actually done). One self-contained file — no server, no install, works on the sales-floor phone. Fourteen modules: command center, quant engine (reverse solver / sensitivity / Monte Carlo), sales & lead engines, hiring & academy, compliance vault (fee-cap ledger, KYC gates, analyst sign-off), finance & cash, the daily ritual, the 31-agent console, and the weekly review. Manual: [`docs/OPERATOR.md`](docs/OPERATOR.md).

First run: answer **Discovery** (the 16 questions the model needs), then confirm the restated one-pager. Until then OPERATOR runs on the brief's CEO defaults — every number editable in **Config**.

| # | Read/do | Where |
|---|---|---|
| 0 | **START HERE — the T-15 launch runway**: gates, roles, critical path, and the honest verdict on what can launch on Day 1 | [`docs/PRELAUNCH.md`](docs/PRELAUNCH.md) |
| 0b | Product build + the back-testing protocol (thresholds published before results exist) | [`docs/PRODUCT-READINESS.md`](docs/PRODUCT-READINESS.md) |
| 0c | **Live data feed** — how the dashboard fetches instead of asking, and how to refresh it | [`docs/DATA-FEED.md`](docs/DATA-FEED.md) |
| 1 | **OPERATOR manual** — model in one page, the 14 modules, data rules | [`docs/OPERATOR.md`](docs/OPERATOR.md) |
| 2 | App source (React/TS; `npm install && npm run build`) | [`app/`](app) |
| 3 | Claude skills that carry the domain knowledge (compliance, sales playbook, creative pre-flight, war-room ritual, MIS formats) | [`.claude/skills/`](.claude/skills) |
| 4 | v1 roadmap & department playbooks (webinar-era plan — arithmetic still instructive) | [`ROADMAP.md`](ROADMAP.md), [`docs/departments/`](docs/departments) |
| 5 | Compliance gates (v1 doc + v2 note; the live machinery is OPERATOR M9) | [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) |
| 6 | v1 portal (superseded, kept for reference) | [`portal/legacy-v1.html`](portal/legacy-v1.html) |
| 7 | CSV templates for the Google-Sheets master tracker (optional alongside OPERATOR) | [`templates/`](templates) |

## The calendar

**Prep runway: Tue 11 Aug (T-15) → Tue 25 Aug (T-1, go/no-go 18:00). Sprint Day 1 = Wed 26 Aug 2026. Day 60 = Sat 24 Oct 2026.**
Open OPERATOR and it lands on **M0 Launch Readiness** until T-0: 36 gates (16 blocking), 119 dated steps, 14 role charters, the tool stack and the offline tripwires.

**The finding that shapes everything:** ~₹10.25L of the ₹25L monthly mix cannot lawfully launch on Day 1 — the research line has no named analyst, no Compliance Officer and no validation evidence. Either research opens by ~Day 20, or Day 60 re-bases to ₹15–17L with ₹25L at Day 85–95. Read [`docs/PRELAUNCH.md`](docs/PRELAUNCH.md) §1 before anything else.

## Week-1 unblocks (the two dates that decide the sprint)

1. **Ad accounts verified** — SI-Portal contacts registered; the exact same email/mobile on Meta (SEBI advertiser verification) and Google (India financial-services verification). Separate ad accounts for the education and research brands.
2. **Cohort 1 hired into the Academy** — 6 joiners by Day 8; the Day-2 SEBI-compliance gate (≥95%) is non-negotiable.
3. Scanner split shipped: Lite (user-defined screens, education) vs Pro (signals, RA service behind KYC + analyst sign-off).
4. Speed-to-lead under 5 minutes, on a screen the floor can see.
5. Fee-cap ledger live before the first research-service invoice (OPERATOR M9).

## Honest frame

From a ≈₹5L base with 5 closers, ₹25L by Day 60 is the ~25–30% case; ₹16–18L is P50, and ₹25L by Day 85–95 is the ~75% case. **The plan is identical either way — only the date on the wall changes.** A team that fakes the date usually mis-sold to get there; in a regulated business that trade is never worth it. The live probability, recomputed from actuals, is on the Command Center.
