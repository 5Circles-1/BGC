# Finance — Department Playbook

**Mission:** every rupee visible, reconciled and compliant — cash is the scoreboard the sprint is played on, and growth capital must not pour into a leaky bucket.
**The number Finance owns:** collections vs target, reported daily by 9 pm — and trusted.
**Team:** Sanya (registers, salary, banking) + Management sign-off + CA (quarterly, per the manual).

## First principle of the sprint

The audit found ₹33.7L of cash fee collections with only ₹47,200 banked, three unexplained cash gaps (₹1.8L / ₹0.98L / ₹0.95L), and ~₹43L of undocumented director funding. None of that stops the sprint — but it means the sprint runs on rails: **all new online revenue flows through the payment gateway into the company account, with zero exceptions.** Online scale conveniently makes the clean path the easy path.

## Run the Accounts Manual — for real

The manual (v1.0, Aug 2026) is written; the registers are still empty templates. Sprint rule: **populated registers are a Day-7 deliverable**, then maintained daily.

- Main Cash Book daily with named custodian; petty cash on imprest.
- Daily cash count; **weekly banking of all cash, max ₹25,000 float**.
- Salaries by bank transfer only (no repeat of Jul–Aug 2025's ₹4.6L cash payroll).
- No deletions — reversing entries only; monthly close by the 10th, locked copies.
- Mechanical caps respected: **₹2,00,000 cash-receipt limit per s.269ST** (penalty = the amount received) and ₹10,000/day cash-payment cap per s.40A(3). Any fee that would breach → gateway link instead, full stop.

## Sprint duties (daily / weekly)

| Rhythm | Duty |
|---|---|
| Daily by 9 pm | Collections line on the scorecard: gateway settlements + fee-register receipts, reconciled to `Collections` tab (Make S2 auto-inserts online payments) |
| Daily | Invoice for every payment, numbered per the fee-register series; GST 18% shown where registered |
| Weekly (Mon) | CAC, ROAS, refund rate, AOV to the weekly review; ad-spend actuals vs tranche |
| Weekly | Gateway settlement reconciliation to bank; incentive payout run for Sales |
| By Day 30 | Director-loan documentation cleanup (agreements + DPT-3 position with CA) |

## Money plumbing to stand up in Week 0–1

1. Razorpay/Cashfree checkout links per product from the **price book** (Finance is the price book's custodian — no off-book pricing can be invoiced).
2. **EMI / part-payment options** live on checkout — recovers "fees zyada" objections; part-payment schedule tracked in `Collections` with due-date chasing (W7 sweep).
3. Refund policy published; refunds processed within the stated window; **refund rate > 5% on any offer = the offer goes to the weekly review for surgery**.
4. GST/TDS calendar on the wall: GSTR-1 by the 11th, GSTR-3B by the 20th (if registered — confirm status with CA in Week 1), TDS deposit by the 7th, 24Q/26Q quarterly. TDS on marketing agencies/freelancers (194C/194J) applied at source.
5. Rigi/community payouts reconciled monthly like any other gateway.

## What Finance says "no" to (so the target survives)

- Cash for online sales — no.
- Discounts not in the price book — no invoice, so no.
- Ad-spend tranche release when the week's ROAS < 3 and falling — escalate to Management with the recovery playbook open.
- Untracked spending "for growth" — every growth rupee has a line in the budget (`ROADMAP.md §9`).

## KPI table

| KPI | Target | Read when |
|---|---|---|
| Collections vs daily requirement | ≥ 100% | Daily war room |
| Reconciliation lag (gateway ↔ books) | < 24h | Daily |
| Refund rate | < 5% | Weekly |
| CAC (spend ÷ new students) | ≤ ₹5,500 base | Weekly |
| Cash banked weekly / float ≤ ₹25k | 100% weeks | Weekly |
| Registers current (per manual) | Yes from Day 7 | Day 15/30/45 checkpoints |

## Interfaces

- **Gives Management:** the true cash position, daily — one number, no surprises.
- **Gives Sales:** payment links, EMI options, same-hour payment confirmation.
- **Gives Marketing:** spend tranche released weekly while rates hold.
- **Gets from Sales:** deal + payment data same hour; **Gets from Marketing:** daily spend figure by 9 pm.

## Week-1 checklist

1. Gateway checkout live per price-book product; test payment end-to-end (₹1 → invoice → `Collections` row → 💰 ping).
2. Invoice series + refund policy published.
3. Registers populated to current (manual §all); weekly banking calendar set.
4. GST registration status confirmed with CA; TDS obligations mapped.
5. Incentive payout mechanics agreed with HR/Sales (weekly, from verified collections only).
