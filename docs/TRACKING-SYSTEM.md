# The Tracking & Interlinking System

One number can only be corrected if exactly one person owns it, it lives in exactly one place, and everyone looks at that place daily. This document defines that place.

## Architecture

```
  Meta Lead Ads ──┐                                    ┌─→ WhatsApp ping to closer (speed-to-lead)
                  ├─→ Make.com scenarios ─→ ┌──────────┴─────────┐
  Razorpay/      ─┘   (automation layer)    │  5C Growth Master  │
  Cashfree webhook                          │  Tracker (Google   │──→ Growth Command Center
                                            │  Sheet, 7 tabs)    │    (portal — the daily
  Manual entries (each dept, by 9 pm) ────→ └────────────────────┘    war-room screen)
```

Three layers, each replaceable without breaking the others:

1. **Master Tracker (Google Sheet)** — the single source of truth. Seven tabs, one per data stream. Import the CSV templates in `/templates` to create it (File → Import → Upload, one tab per CSV, keep the tab named like the file).
2. **Make.com (automation layer)** — moves data so humans don't retype it. Account `5Circles Pvt Ltd` is connected and verified.
3. **Growth Command Center (portal)** — `/portal/index.html`, the meeting screen. The war-room anchor enters the day's scorecard line here each evening; it computes pace, funnel health, and department status. It is also published as a private web page (link in the project README) so founders can open it on a phone.

## Who updates what, and when

| Tab | Owner | When | Fed by |
|---|---|---|---|
| `Lead_Log` | Marketing (auto) | Real-time | Make scenario S1 from Meta Lead Ads |
| `Daily_Scorecard` | Each dept's column, Sales head closes the row | Daily by 9:00 pm | Manual + formulas |
| `Sales_Pipeline` | Every closer, own deals | Live, after every call | CRM/manual |
| `Collections` | Finance | Same day as payment | Make scenario S2 from gateway webhook + manual for offline |
| `Hiring_Tracker` | HR | On every stage change | Manual |
| `Blockers` | Anyone raises; Management clears | Live | Manual + portal |
| `Weekly_Review` | Management | Monday 10:00 am | Rolled up from Daily_Scorecard |

**The rule that makes this work:** a number missing at 9:00 pm is treated as a red flag in the next morning's war room, the same severity as a bad number. Bad numbers get help; missing numbers get escalation.

## Make.com scenarios (build order)

> ⚠️ The Make account is on the **Free plan**: 1,000 operations/month, 2 active scenarios, 15-minute polling. At planned lead volume (50–150 leads/day) this exhausts in under a week. **Upgrade to Core before launch day** (Management approval, ~₹800–900/month). Until upgraded, build S1 and S2 only.

- **S1 — Speed-to-lead (build Day 3):** Meta Lead Ads "New Lead" → add row to `Lead_Log` → send WhatsApp template acknowledgment to the lead → notify the on-duty closer (WhatsApp/Telegram) with name + phone + campaign. Target: closer calls within **5 minutes**. This single automation is worth more than any dashboard — contact-rate decays by the minute.
- **S2 — Cash telegraph (build Day 4):** Payment gateway `payment.captured` webhook → add row to `Collections` → post "💰 ₹34,999 — Flagship — [name]" to the founders/sales group. Every rupee visible within seconds keeps the team hungry and Finance reconciled.
- **S3 — 9 pm digest (after upgrade):** scheduled daily → read today's `Daily_Scorecard` row → send formatted summary (spend, leads, CPL, sales, revenue, cumulative vs target) to the founders' group.
- **S4 — Webinar attendance sync (after upgrade):** Zoom/webinar platform attendance report → mark `Lead_Log` rows Attended/No-show → no-shows enter the replay + re-invite flow.

## The portal (Growth Command Center)

- **Dashboard** — collected vs ₹25,00,000, days left, required daily run-rate, pace status, KPI tiles, daily revenue chart, department health strip.
- **Funnel** — the live math: edit CPL / show rate / close rate / ticket size and see projected revenue vs target, plus the reverse view (what today's numbers must be to stay on pace).
- **60-Day Plan** — every week's tasks as checklists; progress is visible to everyone.
- **Departments** — the interlink map: what each department owes the next one, with SLAs.
- **War Room** — daily entry form (the 9 pm ritual), recent days table, blockers board.
- **Data** — export/import JSON backup, CSV export of the daily log, targets & settings.

Data entered in the portal persists in the browser it was entered on (plus manual JSON backup/export). The Master Tracker sheet remains the authoritative record; the portal is the meeting instrument that makes the numbers confrontable.

## Meeting cadence (the human layer)

| Ritual | When | Duration | Screen | Output |
|---|---|---|---|---|
| Morning war room | Daily 9:15 am | 20 min | Portal Dashboard + War Room | Yesterday's misses owned, today's 3 commitments per dept |
| Collections check | Daily 9:00 pm | 10 min | Portal War Room entry | Scorecard row complete |
| Weekly review | Monday 10:00 am | 60 min | Portal + `Weekly_Review` tab | Kill/scale decisions, next week's targets |
| Checkpoint reviews | Day 15 / 30 / 45 | 90 min | Full roadmap | Scenario re-forecast, hiring triggers |

## Escalation & correction loop

1. Any KPI red for **2 consecutive days** → auto-agenda item in next war room; owning department brings a fix proposal, not an explanation.
2. Blocker unresolved **48 hours** → moves to Management, logged in `Blockers` with a named owner and a date.
3. Any week below **70% of revenue target** → Sunday emergency review; the following week runs the recovery playbook in `ROADMAP.md`.
