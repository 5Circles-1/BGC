# The Data Feed — how OPERATOR stops asking for numbers it can fetch

**The problem this solves.** OPERATOR v2 computed everything downstream of a nightly form asking four functions for ~40 numbers. Nobody filled it, so every screen rendered zeros. In a company whose registers were written and left empty, whose CRM training doc was a stub, and whose 260+ July leads all stayed at status `CREATED`, a design that depends on manual daily entry was designing against the evidence.

**The rule now: if a system already holds the number, the dashboard fetches it.**

---

## What the feed carries today

Live Meta ad data — campaigns, ads, spend, impressions, leads, CPL, CTR, frequency — pulled through the connected Meta ads account.

The first pull (10 Aug 2026, lifetime) is built into the app and loadable from **Config → Live data → "Load the 10 Aug live pull"**. It is real data from the account, not sample figures.

## How to refresh it

The dashboard is a single static file with no server, so it cannot call the Meta API itself. The refresh path is one instruction:

> **Ask a Claude session that has the 5 Circles Meta connection: _"Refresh the OPERATOR feed."_**

Claude pulls the account, prints a `FeedSnapshot` JSON block, and you paste it into **Config → Live data → Paste a feed snapshot → Import snapshot**. Takes under a minute and replaces roughly two-thirds of the nightly typing.

Ask for a **per-date pull** (`time_increment: "1"`) when you want the pacing line back-filled — a lifetime snapshot populates the campaign and ad tables but cannot fill daily logs.

## Snapshot format

```jsonc
{
  "pulledAt": "2026-08-10T11:55:00+05:30",
  "source": "meta:ads-mcp (lifetime / date_preset=maximum)",
  "accounts":  [{ "id": "…", "name": "…", "currency": "INR", "hasPaymentMethod": true, "status": "ACTIVE" }],
  "campaigns": [{ "id": "…", "name": "…", "status": "ACTIVE", "objective": "OUTCOME_LEADS",
                  "spend": 1269.83, "impressions": 20767, "clicks": 615, "ctr": 2.96, "cpc": 2.06, "reach": 11322 }],
  "ads":       [{ "id": "…", "name": "…", "campaign": "…", "status": "ACTIVE",
                  "spend": 1270.39, "impressions": 20792, "results": 179,
                  "cpl": 7.10, "ctr": 2.96, "frequency": 1.835 }],
  "daily":     [{ "date": "2026-08-09", "channelId": "meta", "spend": 412.00, "leads": 58 }]   // optional
}
```

`daily` rows back-fill `leadsBySource` and `spend` in the daily logs. **Locked days are never overwritten** — the audit trail holds.

## What the feed does with the data

**1. Separates customer acquisition from recruitment.** A hiring ad judged against the customer CPL target produces confidently wrong advice — "scale this" when the right answer is "stop the day Cohort 1 is signed." Any ad or campaign matching `hiring|recruit|vacancy|job` is classified as recruitment, excluded from customer CPL, and given hiring-specific guidance.

**2. Turns every ad into a decision.** Rules mirror the marketing playbook:

| Condition | Action |
|---|---|
| CPL ≤ target, frequency < 2.5 | **Scale** — raise budget 20–30%/day and no more; bigger jumps reset the learning phase |
| Frequency > 2.5 | **Refresh creative** — rotate a new hook from the same winning angle, don't kill the angle |
| CPL > 2× target | **Pause** — never raise budget to buy through a bad CPL |
| Spend ≥ 3× target CPL, zero leads | **Pause** — it has had its fair chance |
| Spend < 3× target CPL, zero leads | **Hold** — not enough spend to judge yet |
| `LINK_CLICKS` objective with spend | **No lead path** — clicks aren't leads and a closer can't work them |
| ≥25 leads produced | **Verify quality** — see below |

**3. Raises the backlog alarm.** Leads generated minus leads dispositioned. This is the single most valuable thing the feed does, because it is the failure that already happened: *a cheap lead nobody calls costs more than an expensive one that converts.* The Morning Brief refuses to let this hide.

## What the feed does not yet carry

Honest gaps, in priority order:

1. **Collections** — sits in the payment gateway. Until a Make.com scenario pushes `payment.captured` into the feed, collections stay manual. This is the highest-value next connection.
2. **Dials, connects, talk time** — will exist once cloud telephony is live (runway step T-4). Wire it the same week.
3. **Lead quality grade** — no system holds it; it comes from the floor's disposition discipline. The feed can count leads, not judge them.
4. **Individual leads and deals** — the dashboard stores daily aggregates, not entities. It can tell you 179 leads exist and nobody worked them; it cannot yet hand a closer the list. That is the next structural step if you want it to *drive* the day rather than describe it.

## The first pull, and what it told us

| Ad | Spend | Leads | CPL | Read |
|---|---|---|---|---|
| New Leads ad | ₹1,270 | 179 | **₹7.10** | Beating the ₹65 plan assumption by ~89% at frequency 1.83 |
| Social Media Face Variant A | ₹349 | 6 | ₹58.18 | **Recruitment**, not customer — excluded from CPL |
| Instagram post: NIFTY UP BY 3% | ₹533 | — | — | `LINK_CLICKS` — no lead path, ₹533 with nothing a closer can work |

Two caveats stated plainly, because they decide whether the ₹7.10 is real:

- **179 leads is a small sample**, and CPL rises with scale as you exhaust cheap engagement audiences and move to cold volume. Do not re-plan the whole model on it — but do stop assuming ₹65 without testing.
- **Lead quality is unmeasured.** July proved the point inside this business: a broad form produced ~25 leads/day of meme names and foreign numbers, while a verified multi-layer form produced ~11/day of serious respondents. A ₹7 CPL usually means a low-friction form. Grade these leads before scaling behind the number.
