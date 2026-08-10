# OPERATOR v2 — the Business Operating System

**The instrument:** [`portal/index.html`](../portal/index.html) — one self-contained file (~900 KB, React compiled in, no server, no install). Open it in any browser, laptop or phone. Source lives in [`/app`](../app) (`npm install && npm run build` → `app/dist/index.html`).

OPERATOR supersedes the v1 Growth Command Center (kept at [`portal/legacy-v1.html`](../portal/legacy-v1.html)). v1 was built webinar-led and education-only because SEBI registration was unverified; v2 implements the confirmed brief: SEBI RA **INH000020004**, phone-first acquisition (no webinars), the P0–P4b product ladder, two desks, and full RA compliance machinery. **Day 1 = 11 Aug 2026, Day 60 = 9 Oct 2026.**

## The model in one page

**Target:** ₹25,00,000/month collections run-rate by Day 60, from a ≈₹5L base — a 5× in 60 days. Honest odds (live Monte Carlo in M2): **P(hit by Day 60) ≈ 20–30% on defaults; base case lands ₹16–18L by Day 60 and ₹25L by Day 85–95.** The plan is identical either way; only the date moves. The two dates that decide which side you land on: **ad-account verification** and **Cohort 1 joining** — both must sit inside Week 1.

**The machine:** Desk A closes the ₹1,999 course on a single call and attaches Scanner Lite (plan ≈₹12.5L/mo). Desk B works buyers aged 30–90 days into research, workshops and mentorship (plan ≈₹12.7L/mo) — half the target comes from people who already paid once, and that half doesn't exist yet. Solved backwards: 380 P1 sales ÷ 3.47% net lead→sale ≈ **11,000 leads/mo (≈421/day)** → ≈₹5L/mo ad spend at ₹65 CPL, ramped ₹2L → ₹3.5L → ₹5L with collections, never ahead of them. Floor: 11 Desk A + 4 Desk B ramped-equivalents, built from 5 existing + cohorts of 6/6/4 through the 10-day Academy (45→70→90→100% ramp).

**The guardrails (non-negotiable, enforced in the product):**
1. Every recommendation carries a registered analyst's logged sign-off — AI drafts, humans approve (M9 blocks release without a name + timestamp).
2. No return claims anywhere (M6 pre-flight blocks approval until all 9 rules pass).
3. Every individual/HUF rupee checks the ₹1,51,000/family/yr cap **before** the payment link (M9 ledger gate; advances ≤12 months; refunds pro-rata, zero breakage).
4. Calls recorded; weekly sampled audit.
5. Education ≠ research: separate brands, pages, ad accounts, books. Scanner Lite (user-defined screens) is a tool; Scanner Pro (entry/SL/target) is research behind KYC + agreement + risk profile.

**Cash:** Month 1 spends before Month 2 collects — ₹18–22L working-capital requirement to reach run-rate; runway lives in M10 and alerts below 45 days.

## The fourteen modules

| # | Module | What it runs |
|---|---|---|
| M1 | Command Center | North star, day counter, burn-up vs pace, ₹/remaining working day, P(target), top 3 risks, today's one action |
| M2 | Quant Engine | Reverse funnel solver, sensitivity (±10/20%), Monte Carlo (P10/P50/P90 + P(hit)), scenario save/compare, weekly build-up |
| M3 | Revenue & P&L | Collections by product/desk/day, contribution margins, plan mix |
| M4 | Sales Command | Roster (incl. planned cohorts), per-rep scorecards, ramp position, desk maths |
| M5 | Lead Engine | Leads by source, CPL vs target, speed-to-lead, concentration, **channel-health monitor with risk scores** |
| M6 | Marketing & Creative | Creative library with per-asset CPL, 9-rule pre-flight queue, production quota |
| M7 | HR & Hiring | 9-stage pipeline, headcount plan vs actual (29 seats), time-in-stage |
| M8 | Sales Academy | 10-day certification matrix; D2 compliance gate (≥95%) hard-blocks D3+ |
| M9 | Compliance Vault | **Fee-cap ledger + payment-link gate**, KYC/agreement/risk gates with provisioning lock, analyst sign-off queue, ad approval register, grievances with clocks, regulatory calendar, AI-use register |
| M10 | Finance & Cash | Runway projection, P&L plan, payroll + incentive calculator with 30-day clawback, pro-rata refund calculator |
| M11 | Ops & Delivery | Onboarding funnel (gates narrow left→right), tickets with SLA, churn watch |
| M12 | Daily Ritual | EOD form → auto variance → tomorrow's task list → the day's exercise (60-exercise adaptive bank); day locking, audited |
| M13 | Agent Console | 31 agents across 7 functions: editable prompts, human-gate registry, "copy run pack" (prompt + live data → paste into Claude), run log |
| M14 | Weekly Review | Auto-assembled Monday pack: plan vs actual, wins/misses/decisions, print/CSV |

Plus **Discovery** (the brief's Section-14 questionnaire — answer, then confirm the restated model; the one-page restatement prints for sign-off) and **Config** (every assumption editable: ladder prices/units, funnel rates, weekly pacing plan, ramp curve, comp, channels, spend tranches, fee cap, GST basis gross/net — with "restore CEO defaults").

## Data & persistence — read this once

- Everything stores **in the browser** (`localStorage`, `bos:*` keys). No server, no client PII — family/client **codes only**; PII belongs in the CRM.
- **Team use:** run one operator machine for the war room, and pass the **full JSON backup** (Config → Export) around as the daily record. If storage is unavailable (some embeds), OPERATOR runs memory-only and shows a warning — export backups.
- The published claude.ai artifact copy is a private preview/share surface; the repo file is the daily driver.
- The brief specified the claude.ai chat-artifact `window.storage` API; that API doesn't exist on this deployment surface, so OPERATOR implements the same get/set/list contract over localStorage with graceful fallback — same behaviour, honest about the medium.

## The AI agents (M13) — how they actually run

A static file can't call an LLM, so the console is the **registry + prompt library + run log**, and each agent's **"Copy run pack"** button assembles its system prompt plus a live JSON snapshot of the relevant numbers. Paste into Claude, act on the output through the agent's human gate, log the run (the log feeds the AI-use register in M9). Five custom Claude skills in [`.claude/skills/`](../.claude/skills) carry the domain knowledge (`sebi-ra-compliance`, `sales-playbook`, `creative-preflight`, `daily-war-room`, `mis-reporting`) — any Claude Code session in this repo picks them up automatically; they can also be added to claude.ai (Settings → Capabilities → Skills).

## Verify before relying (compliance numbers encoded in defaults)

Fee cap ₹1,51,000/family/yr (8 Jan 2025, CII-indexed) · advance fees ≤12 months, pro-rata refunds, zero breakage · RA Ad Code mandatory elements + banned claims · Meta SEBI advertiser verification (31 Jul 2025) + Google India FS verification + SI-Portal contact matching · AI-usage responsibility and disclosure. All editable in Config; **confirm each against current SEBI circulars with the Compliance Officer — this software encodes policy, it does not give legal advice.**
