---
name: mis-reporting
description: House formats and metric definitions for 5 Circles management reporting — the Monday WBR pack, the monthly board pack, and the exact definitions of CPL, connect rate, net conversion, run-rate, contribution and pacing so every report computes numbers identically. Use when assembling, reviewing or automating any weekly/monthly business review, MIS, or board reporting.
---

# MIS & Reporting — house formats

Rule zero: **numbers first, adjectives never.** Every figure traces to OPERATOR (or the gateway/CRM export it came from). A number that can't be traced doesn't go in the pack.

## Metric definitions (one source of truth)

- **Collections:** money received (gateway-settled or banked), gross incl. GST unless the pack says otherwise. Never bookings.
- **Run-rate:** trailing 7 working days' collections × 26. Working days = Mon–Sat.
- **Pacing variance:** cumulative actual − cumulative required, where required integrates the weekly run-rate plan over working days.
- **CPL:** paid spend ÷ paid leads, per channel and blended. Quality-adjusted CPL divides by A+B-grade leads only.
- **Connect rate:** connects ÷ dials. **Qualification rate:** qualified conversations ÷ connects. **Close rate:** sales ÷ qualified conversations. **Net lead→sale:** product of the three.
- **AOV (P1 blended):** P1 price + bump price × take rate.
- **Contribution:** collections − GST − gateway fees − direct sales incentive. Ad spend reported separately, not allocated per product.
- **CAC:** paid spend ÷ new paying customers (by channel where attributable).
- **Ramp %:** expected output share by week since join (45/45/70/70/90/90/100 default).

## Monday WBR pack (assembled Sunday night; meeting 10:00, ≤45 min)

1. **The number:** last week's collections vs plan, cumulative vs pace line, current run-rate, P(target) from the Monte Carlo. Four figures, one line each.
2. **Plan vs actual by function:** sales (units, per-rep), marketing (leads, CPL, spend), hiring (stage counts, joins), ops (onboarding, SLA), compliance (queues, audits done), finance (recon, cash days). Misses flagged, each with its first broken rate.
3. **Wins (max 3):** each with the number that proves it.
4. **Misses (max 3):** each with root cause and the fix already started.
5. **Decisions needed from the CEO (max 3):** options + a recommendation each. If a decision has an obvious answer, it isn't brought — it's taken.
6. **This week's targets:** next run-rate step, collections needed, the one focus.

Export: OPERATOR M14 (print or CSV). The pack is submitted, then it's frozen — revisions are next week's learning, not this week's edit.

## Monthly board pack (5 pages max)

1. **P&L:** collections by product/desk, opex by line, EBITDA, vs plan.
2. **Unit economics:** CAC, contribution margin, LTV-observed, payback, by product and channel.
3. **Funnel & capacity:** leads → sales waterfall, close rates, floor headcount vs plan, ramp position.
4. **Cash:** runway, working capital deployed vs required, collections cover.
5. **Compliance & risk:** cap-ledger near-limits, grievance count and clocks, audit findings, ad-account health, sign-off log volume. One page, no euphemism.

## Formatting rules

Indian digit grouping (₹25,00,000) and lakh/crore shorthand in prose (₹25.0L). Tabular figures for all columns. Plan/actual/variance in that column order. Red only for misses and breaches, never decoration. Every table exportable as CSV; every pack printable on A4.
