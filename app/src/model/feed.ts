// The data feed. OPERATOR stops asking humans for numbers a system already holds.
//
// Mechanism: a Claude session with the Meta MCP connected pulls live ad data and
// writes a FeedSnapshot (see docs/DATA-FEED.md). The dashboard imports it and
// back-fills the daily logs. Nothing is typed twice.

import type { AppData, DailyLog } from './types'

export interface FeedAd {
  id: string; name: string; campaign?: string; status: string
  spend: number; impressions: number; results: number
  cpl: number | null; ctr: number | null; frequency: number | null
}
export interface FeedCampaign {
  id: string; name: string; status: string; objective: string
  spend: number; impressions: number; clicks: number; ctr: number | null; cpc: number | null; reach: number
}
export interface FeedSnapshot {
  pulledAt: string            // ISO timestamp of the pull
  source: string              // e.g. 'meta:ads-mcp'
  windowFrom?: string; windowTo?: string
  accounts: { id: string; name: string; currency: string; hasPaymentMethod: boolean; status: string }[]
  campaigns: FeedCampaign[]
  ads: FeedAd[]
  /** Optional: per-date spend/leads so daily logs can be back-filled exactly. */
  daily?: { date: string; channelId: string; spend: number; leads: number }[]
}

// ---------------------------------------------------------------------------
// The first real pull — 5 Circles Meta accounts, lifetime to 10 Aug 2026.
// These are actual figures from the connected account, not illustrations.
// ---------------------------------------------------------------------------

export const FIRST_PULL: FeedSnapshot = {
  pulledAt: '2026-08-10T11:55:00+05:30',
  source: 'meta:ads-mcp (lifetime / date_preset=maximum)',
  accounts: [
    { id: '1060045809809807', name: 'Mr Rahul Sarawagi for 5 Circles', currency: 'INR', hasPaymentMethod: true, status: 'ACTIVE' },
    { id: '880945411662821', name: '(unnamed)', currency: 'INR', hasPaymentMethod: true, status: 'ACTIVE' },
    { id: '1743764637754088', name: '(unnamed)', currency: 'INR', hasPaymentMethod: false, status: 'ACTIVE' },
  ],
  campaigns: [
    { id: '120249164626060430', name: 'New Leads campaign', status: 'ACTIVE', objective: 'OUTCOME_LEADS', spend: 1269.83, impressions: 20767, clicks: 615, ctr: 2.96, cpc: 2.06, reach: 11322 },
    { id: '120249232863010430', name: 'Hiring | Social Media Face | Options Lab | Kanpur', status: 'ACTIVE', objective: 'OUTCOME_LEADS', spend: 348.39, impressions: 3212, clicks: 44, ctr: 1.37, cpc: 7.92, reach: 1872 },
    { id: '120244355513180414', name: 'Instagram post: NIFTY UP BY 3%', status: 'ACTIVE', objective: 'LINK_CLICKS', spend: 533.47, impressions: 24723, clicks: 474, ctr: 1.92, cpc: 1.13, reach: 22830 },
  ],
  ads: [
    { id: '120249164626040430', name: 'New Leads ad', campaign: 'New Leads campaign', status: 'ACTIVE', spend: 1270.39, impressions: 20792, results: 179, cpl: 7.10, ctr: 2.96, frequency: 1.835 },
    { id: '120249243870440430', name: 'Social Media Face | Variant A', campaign: 'Hiring | Social Media Face', status: 'ACTIVE', spend: 349.07, impressions: 3223, results: 6, cpl: 58.18, ctr: 1.37, frequency: 1.739 },
  ],
}

// ---------------------------------------------------------------------------
// Ad actions — turn numbers into a decision. Rules mirror the marketing
// playbook: never scale into a broken rate, never pause without a fair chance.
// ---------------------------------------------------------------------------

export type ActionKind = 'scale' | 'hold' | 'refresh' | 'pause' | 'verify_quality' | 'no_lead_path'
export interface AdAction {
  ad: FeedAd
  kind: ActionKind
  headline: string
  why: string
  severity: 'good' | 'warn' | 'crit' | 'acc'
}

/** Recruitment ads are not customer acquisition. Judging a hiring ad against the
 *  customer CPL target produces confidently wrong advice, so classify first. */
export function isRecruitment(nameOrCampaign: string): boolean {
  return /hiring|recruit|vacancy|job|walk-?in interview/i.test(nameOrCampaign)
}

export function adActions(ads: FeedAd[], targetCpl: number): AdAction[] {
  const out: AdAction[] = []
  for (const ad of ads) {
    if (isRecruitment(`${ad.name} ${ad.campaign ?? ''}`)) {
      const cpa = ad.results > 0 ? (ad.cpl ?? ad.spend / ad.results) : null
      out.push({
        ad, kind: 'hold', severity: 'acc',
        headline: cpa ? `Recruitment ad — ${ad.results} applicants at ₹${cpa.toFixed(2)} each` : 'Recruitment ad — no applicants yet',
        why: `This is a hiring campaign, not customer acquisition. It is deliberately excluded from customer CPL, and the ₹${targetCpl} target does not apply to it. Judge it on applicants who actually reach interview: the runway needs ~36 sourced candidates for 6 signed offers, so keep it running while the pipeline is short and stop it the day Cohort 1 is signed.`,
      })
      continue
    }
    const fairChance = ad.spend >= targetCpl * 3
    if (ad.results === 0) {
      out.push({
        ad, kind: fairChance ? 'pause' : 'hold', severity: fairChance ? 'crit' : 'warn',
        headline: fairChance ? 'Pause — spent without a single lead' : 'Hold — not enough spend to judge',
        why: fairChance
          ? `₹${Math.round(ad.spend)} spent, zero leads. It has had more than three times the target CPL to prove itself and has not. Kill it and put the budget behind a winner.`
          : `Only ₹${Math.round(ad.spend)} spent. Give it at least ₹${Math.round(targetCpl * 3)} before judging — an ad that spends 2× target CPL with no lead is off, but this has not had its chance yet.`,
      })
      continue
    }
    const cpl = ad.cpl ?? ad.spend / ad.results
    if ((ad.frequency ?? 0) > 2.5) {
      out.push({
        ad, kind: 'refresh', severity: 'warn',
        headline: 'Refresh the creative — audience fatiguing',
        why: `Frequency is ${ad.frequency?.toFixed(2)}, above 2.5. The same people are seeing it repeatedly and CPL will climb from here. Rotate a new hook from the same winning angle rather than pausing the angle.`,
      })
    } else if (cpl <= targetCpl) {
      out.push({
        ad, kind: 'scale', severity: 'good',
        headline: `Scale — CPL ₹${cpl.toFixed(2)} against a ₹${targetCpl} target`,
        why: `Beating target by ${Math.round((1 - cpl / targetCpl) * 100)}%, frequency ${ad.frequency?.toFixed(2) ?? '—'} with room left. Raise budget 20–30% per day and no more — bigger jumps reset the learning phase and you lose the rate you are trying to buy more of.`,
      })
    } else if (cpl > targetCpl * 2) {
      out.push({
        ad, kind: 'pause', severity: 'crit',
        headline: `Pause — CPL ₹${cpl.toFixed(2)} is over twice target`,
        why: `Do not raise budget to buy through a bad CPL. Fix the creative or the form first; spend freezes at the last profitable level.`,
      })
    } else {
      out.push({
        ad, kind: 'hold', severity: 'acc',
        headline: `Hold — CPL ₹${cpl.toFixed(2)}, above target but workable`,
        why: `Between target and 2× target. Leave the budget where it is and ship a new hook against the same audience; decide again in 48 hours.`,
      })
    }
    // The July lesson, made mechanical.
    if (ad.results >= 25) {
      out.push({
        ad, kind: 'verify_quality', severity: 'warn',
        headline: `${ad.results} leads generated — confirm they are being worked`,
        why: `A cheap lead that nobody calls costs more than an expensive one that converts. In July, 260+ leads were generated and every one stayed at status CREATED. Sales must confirm connect rate and lead grade before this budget scales.`,
      })
    }
  }
  // Campaign-level objective check: paying for clicks with no lead path.
  return out
}

export function objectiveWarnings(campaigns: FeedCampaign[]): AdAction[] {
  return campaigns
    .filter(c => c.objective === 'LINK_CLICKS' && c.spend > 0)
    .map(c => ({
      ad: { id: c.id, name: c.name, status: c.status, spend: c.spend, impressions: c.impressions, results: 0, cpl: null, ctr: c.ctr, frequency: null },
      kind: 'no_lead_path' as ActionKind,
      severity: 'warn' as const,
      headline: 'Optimised for clicks, not leads — no measurable lead outcome',
      why: `₹${Math.round(c.spend)} spent on a LINK_CLICKS objective. Clicks are not leads and cannot be worked by a closer. Either move this budget to a lead-form objective or treat it explicitly as brand spend with no CPL expectation.`,
    }))
}

// ---------------------------------------------------------------------------
// Applying a feed to the operating record
// ---------------------------------------------------------------------------

export interface FeedApplyResult { daysTouched: number; leadsAdded: number; spendAdded: number; notes: string[] }

/** Back-fill daily logs from a feed's per-date rows. Manual entries are never overwritten
 *  silently — feed values replace only the spend/leadsBySource keys the feed owns. */
export function applyFeed(data: AppData, feed: FeedSnapshot): { data: AppData; result: FeedApplyResult } {
  const notes: string[] = []
  if (!feed.daily?.length) {
    notes.push('Snapshot carries lifetime totals only, no per-date rows — campaign and ad tables are populated, daily logs are not. Ask for a per-date pull to back-fill the pacing line.')
    return { data, result: { daysTouched: 0, leadsAdded: 0, spendAdded: 0, notes } }
  }
  const daily = { ...data.daily }
  let leads = 0, spend = 0
  const days = new Set<string>()
  for (const row of feed.daily) {
    if (!row || typeof row.date !== 'string') continue
    const base: DailyLog = daily[row.date] ?? {
      date: row.date, units: {}, collections: {}, leadsIn: 0, leadsBySource: {}, spend: {},
      dials: 0, connects: 0, quals: 0, speedToLeadMedianMin: null, reps: {}, notes: {}, eod: {}, locked: false,
    }
    if (base.locked) { notes.push(`${row.date} is locked — skipped.`); continue }
    const leadsBySource = { ...base.leadsBySource, [row.channelId]: row.leads }
    daily[row.date] = {
      ...base,
      leadsBySource,
      leadsIn: Object.values(leadsBySource).reduce<number>((s, v) => s + (v || 0), 0),
      spend: { ...base.spend, [row.channelId]: row.spend },
    }
    days.add(row.date); leads += row.leads; spend += row.spend
  }
  notes.push(`Back-filled ${days.size} day(s) from ${feed.source}.`)
  return { data: { ...data, daily }, result: { daysTouched: days.size, leadsAdded: leads, spendAdded: spend, notes } }
}

export function feedTotals(feed: FeedSnapshot) {
  const customer = feed.ads.filter(a => !isRecruitment(`${a.name} ${a.campaign ?? ''}`))
  const recruitment = feed.ads.filter(a => isRecruitment(`${a.name} ${a.campaign ?? ''}`))
  const spend = customer.reduce((s, a) => s + a.spend, 0)
  const leads = customer.reduce((s, a) => s + a.results, 0)
  const recruitSpend = recruitment.reduce((s, a) => s + a.spend, 0)
  const recruitLeads = recruitment.reduce((s, a) => s + a.results, 0)
  const brandSpend = feed.campaigns.filter(c => c.objective === 'LINK_CLICKS').reduce((s, c) => s + c.spend, 0)
  return {
    spend, leads, cpl: leads > 0 ? spend / leads : null,
    recruitSpend, recruitLeads, recruitCpa: recruitLeads > 0 ? recruitSpend / recruitLeads : null,
    brandSpend, totalSpend: spend + recruitSpend + brandSpend,
  }
}
