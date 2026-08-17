// The whole business in one model: departments, their health, the initiatives
// running inside them, the meetings that decide things, and — the part that
// matters most for a founder who is the bottleneck — what needs him and what
// does not.

import type { AppData, Config } from './types'
import { cashProjection, channelRisk, collectionsOf, pacing, solveFunnel, sprintCal, sprintWeekOf } from './engine'
import { feedTotals, FIRST_PULL } from './feed'
import { PREP_GATES } from './prelaunch'

export type DeptKey = 'sales' | 'marketing' | 'product' | 'operations' | 'finance' | 'hr' | 'compliance' | 'research'
export type Health = 'ok' | 'watch' | 'alarm' | 'critical' | 'unknown'

export interface DeptDef {
  key: DeptKey; name: string; mission: string; ownerRole: string
  /** The single number this department is accountable for. */
  ownsNumber: string
}

export const DEPTS: DeptDef[] = [
  { key: 'sales', name: 'Sales', mission: 'Convert attention into collected revenue — speed-to-lead under five minutes, a disposition on every call, a next step on every deal.', ownerRole: 'Sales Head / Growth Owner', ownsNumber: '₹ collected per day against the line' },
  { key: 'marketing', name: 'Marketing', mission: 'Feed the machine — predictable leads at or under target CPL, on creatives that survive compliance.', ownerRole: 'Media buyer + Yash', ownsNumber: 'Qualified leads per day at CPL ≤ plan' },
  { key: 'product', name: 'Product', mission: 'Ship only what can be delivered exactly as sold, and prove it before it is sold.', ownerRole: 'Harsh + contract engineer', ownsNumber: 'SKUs with a passed acceptance gate' },
  { key: 'operations', name: 'Operations', mission: 'Deliver so well that students become the next marketing channel; protect the offline engine.', ownerRole: 'Ops lead', ownsNumber: 'Onboarding TAT and batch fill %' },
  { key: 'finance', name: 'Finance', mission: 'Every rupee visible, reconciled and compliant. Cash is the scoreboard.', ownerRole: 'Sanya + CA', ownsNumber: 'Collections vs plan, and days of runway' },
  { key: 'hr', name: 'HR', mission: 'Staff the machine ahead of the curve and keep the floor paid, scored and motivated.', ownerRole: 'Sanya + recruitment support', ownsNumber: 'Signed offers against the cohort plan' },
  { key: 'compliance', name: 'Compliance', mission: 'Keep the registration. Nothing reaches a client without the name of a human on it.', ownerRole: 'Compliance Officer', ownsNumber: 'Zero breaches, zero overdue grievances' },
  { key: 'research', name: 'Research', mission: 'Produce research a regulator could read, with evidence behind every call.', ownerRole: 'Registered analyst (to name)', ownsNumber: 'Forward paper sessions logged, batches signed' },
]

// ---------------------------------------------------------------------------
// Initiatives — the ideas being discussed, per department
// ---------------------------------------------------------------------------

export type Stage = 'idea' | 'evaluating' | 'approved' | 'building' | 'live' | 'parked' | 'killed'
export const STAGES: Stage[] = ['idea', 'evaluating', 'approved', 'building', 'live', 'parked', 'killed']

export interface Initiative {
  id: string; title: string; dept: DeptKey; stage: Stage
  impactInrMonthly: number; effortDays: number
  owner: string
  /** Who must decide for this to move. 'founder' is deliberately expensive. */
  decisionFrom: 'owner' | 'head' | 'founder' | 'compliance-officer' | 'board'
  rationale: string
  createdAt: string; movedAt: string
}

// ---------------------------------------------------------------------------
// Meetings — the business is run in these, so they live in the tool
// ---------------------------------------------------------------------------

export type MeetingKind = 'warroom' | 'wbr' | 'checkpoint' | 'board'
export const MEETING_DEF: Record<MeetingKind, { name: string; cadence: string; duration: string; chair: string }> = {
  warroom: { name: 'Daily war room', cadence: 'Every working day 09:00', duration: '20 min', chair: 'Growth Owner' },
  wbr: { name: 'Weekly business review', cadence: 'Monday 10:00', duration: '60 min', chair: 'Growth Owner' },
  checkpoint: { name: 'Checkpoint review', cadence: 'Day 15 / 30 / 45', duration: '90 min', chair: 'Founder' },
  board: { name: 'Monthly board pack', cadence: 'Monthly', duration: '90 min', chair: 'Founder' },
}

export interface Decision {
  id: string; text: string; owner: string; due: string; done: boolean; doneAt?: string
}
export interface Meeting {
  id: string; kind: MeetingKind; date: string; chair: string; attendees: string
  decisions: Decision[]; notes: string; closed: boolean
}

// ---------------------------------------------------------------------------
// Department health — computed from live state, not self-reported
// ---------------------------------------------------------------------------

export interface DeptSignal { label: string; value: string; health: Health; detail: string }
export interface DeptStatus {
  def: DeptDef
  health: Health
  headline: string
  signals: DeptSignal[]
  action: string | null
  actionOwner: string
  founderRequired: boolean
  founderWhy: string
}

const worst = (hs: Health[]): Health => {
  if (hs.includes('critical')) return 'critical'
  if (hs.includes('alarm')) return 'alarm'
  if (hs.includes('watch')) return 'watch'
  if (hs.every(h => h === 'unknown')) return 'unknown'
  return 'ok'
}

export function departmentStatus(cfg: Config, data: AppData, today: string): DeptStatus[] {
  const cal = sprintCal(cfg, today)
  const pace = pacing(cfg, data, today)
  const feed = data.feed ?? FIRST_PULL
  const totals = feedTotals(feed)
  const week = Math.min(sprintWeekOf(cfg, cal.today), cfg.target.runRatePlanWeekly.length)
  const solved = solveFunnel(cfg, cfg.target.runRatePlanWeekly[week - 1])
  const inPrep = today <= cfg.prep.endDate
  const out: DeptStatus[] = []

  const gate = (id: string) => data.readiness.gates[id]?.status
  const gatesFor = (dept: string) => PREP_GATES.filter(g => g.domain === dept)
  const gateHealth = (dept: string): { h: Health; open: number; total: number } => {
    const gs = gatesFor(dept).filter(g => g.blocksLaunch)
    const passed = gs.filter(g => ['passed', 'waived'].includes(gate(g.id) ?? '')).length
    const failed = gs.filter(g => gate(g.id) === 'failed').length
    if (!gs.length) return { h: 'unknown', open: 0, total: 0 }
    if (failed) return { h: 'critical', open: gs.length - passed, total: gs.length }
    if (passed === gs.length) return { h: 'ok', open: 0, total: gs.length }
    return { h: inPrep ? 'watch' : 'alarm', open: gs.length - passed, total: gs.length }
  }

  // ---- Sales
  {
    const sig: DeptSignal[] = []
    const behind = pace.variance < 0
    sig.push({
      label: 'Pace vs line', value: pace.variance >= 0 ? `+${Math.round(pace.variance)}` : `${Math.round(pace.variance)}`,
      health: inPrep ? 'unknown' : behind && Math.abs(pace.variance) > pace.requiredCumToday * 0.15 ? 'alarm' : behind ? 'watch' : 'ok',
      detail: inPrep ? 'Sprint has not started — no collections expected yet.' : `Cumulative actual ₹${Math.round(pace.actualCumToday)} against ₹${Math.round(pace.requiredCumToday)} required.`,
    })
    const lastLog = Object.values(data.daily).sort((a, b) => b.date.localeCompare(a.date))[0]
    const stl = lastLog?.speedToLeadMedianMin
    sig.push({
      label: 'Speed-to-lead', value: stl == null ? 'not measured' : `${stl} min`,
      health: stl == null ? 'unknown' : stl <= cfg.funnel.speedToLeadTargetMin ? 'ok' : 'alarm',
      detail: `Target ≤ ${cfg.funnel.speedToLeadTargetMin} min. This is the single biggest free lever in the business — connect rate 55% → 70%.`,
    })
    const g = gateHealth('sales')
    sig.push({ label: 'Launch gates', value: `${g.total - g.open}/${g.total}`, health: g.h, detail: 'Script on tape and Academy Days 1–5 must exist before a cohort can be trained.' })
    const h = worst(sig.map(s => s.health))
    out.push({
      def: DEPTS[0], health: h,
      headline: inPrep ? 'Building the pitch and the Academy before anyone dials' : behind ? `Behind the line by ₹${Math.round(-pace.variance).toLocaleString('en-IN')}` : 'On or ahead of the line',
      signals: sig,
      action: h === 'ok' ? null : stl != null && stl > cfg.funnel.speedToLeadTargetMin ? 'Fix the lead router before touching the pitch — every minute of delay costs connects.' : behind && !inPrep ? `Pull the follow-up cadence forward and run the 13:00 pacing check against ₹${Math.round(pace.requiredPerRemainingWD).toLocaleString('en-IN')}/day.` : 'Finish the script sign-off and Academy Days 1–5.',
      actionOwner: 'Sales Head', founderRequired: false,
      founderWhy: 'The Sales Head owns the number and the rules are already agreed. Founder joins only if two consecutive weeks land under 70% of plan.',
    })
  }

  // ---- Marketing
  {
    const sig: DeptSignal[] = []
    const cpl = totals.cpl
    sig.push({
      label: 'Customer CPL (live)', value: cpl ? `₹${cpl.toFixed(2)}` : 'no data',
      health: cpl == null ? 'unknown' : cpl <= cfg.funnel.cplBlended ? 'ok' : cpl > cfg.funnel.cplBlended * 2 ? 'alarm' : 'watch',
      detail: cpl ? `${totals.leads} customer leads from ₹${Math.round(totals.spend)}. Plan assumes ₹${cfg.funnel.cplBlended}.` : 'Load a feed snapshot in Config → Live data.',
    })
    const worstAcct = data.channelHealth.map(h => channelRisk(h)).sort((a, b) => b.score - a.score)[0]
    sig.push({
      label: 'Ad account health', value: worstAcct ? `${worstAcct.score}/100 ${worstAcct.band}` : 'unknown',
      health: !worstAcct ? 'unknown' : worstAcct.band === 'low' ? 'ok' : worstAcct.band === 'elevated' ? 'watch' : worstAcct.band === 'high' ? 'alarm' : 'critical',
      detail: 'Verification and SI-portal match are the fix, never new accounts.',
    })
    if (totals.brandSpend > 0) sig.push({
      label: 'Spend with no lead path', value: `₹${Math.round(totals.brandSpend)}`, health: 'watch',
      detail: 'LINK_CLICKS objective — clicks a closer cannot work. Move to a lead form or book it as brand spend.',
    })
    const h = worst(sig.map(s => s.health))
    // The action must address the WORST signal, not the most pleasant one. A cheap
    // CPL on an unverified account is not a reason to scale — it is a reason to
    // finish verification before the account is restricted mid-campaign.
    const acctBad = worstAcct && worstAcct.band !== 'low'
    const banned = data.channelHealth.some(x => x.accountStatus === 'banned')
    out.push({
      def: DEPTS[1], health: h,
      headline: acctBad
        ? `Ad accounts unverified — ${cpl ? `CPL is ₹${cpl.toFixed(2)} but the spend is at risk` : 'cannot spend safely'}`
        : cpl ? `CPL ₹${cpl.toFixed(2)} against a ₹${cfg.funnel.cplBlended} plan` : 'No live ad data loaded',
      signals: sig,
      action: acctBad
        ? 'Finish platform verification and match the SI-portal contact details exactly before scaling spend — a cheap CPL on an account that gets restricted mid-campaign is worth nothing.'
        : cpl != null && cpl <= cfg.funnel.cplBlended
          ? 'Scale the winning ad 20–30% per day and no more — bigger jumps reset the learning phase.'
          : 'Load the live feed so CPL stops being an assumption.',
      actionOwner: 'Media buyer', founderRequired: banned,
      founderWhy: banned
        ? 'An account ban is a company-level problem: it needs the founder on the appeal, the SI-portal registration and the decision to fall back to organic and the warm base.'
        : 'Scaling within the agreed 20–30% band needs no founder. He is needed only to release the next spend tranche, or if an account is banned.',
    })
  }

  // ---- Product
  {
    const g = gateHealth('product')
    const deferred = ['p2c', 'p3', 'p4b']
    const sig: DeptSignal[] = [
      { label: 'Acceptance gates', value: `${g.total - g.open}/${g.total}`, health: g.h, detail: 'A SKU without a passed gate does not go on the price list.' },
      { label: 'Deferred revenue', value: `₹${(cfg.products.filter(p => deferred.includes(p.id)).reduce((s, p) => s + p.priceInclGst * p.unitsPlanMonthly, 0) / 100000).toFixed(2)}L/mo`, health: 'alarm', detail: 'Scanner Pro, Research Subscription and Mentorship cannot lawfully launch on Day 1 — no named analyst, no Compliance Officer, no validation evidence.' },
    ]
    out.push({
      def: DEPTS[2], health: worst(sig.map(s => s.health)),
      headline: 'Roughly ₹10.25L/month of the plan cannot launch on Day 1',
      signals: sig,
      action: 'Decide: hold Day 60 at ₹25L with research opening by ~Day 20, or re-base to ₹15–17L and move ₹25L to Day 85–95.',
      actionOwner: 'Founder', founderRequired: true,
      founderWhy: 'This changes the number on the wall for the whole company. Nobody else can re-base a target, and deferring it to Day 45 is how teams start improvising.',
    })
  }

  // ---- Operations
  {
    const openTickets = data.tickets.filter(t => t.status === 'open').length
    const breaches = data.tickets.filter(t => t.status === 'open' && (Date.now() - new Date(t.openedAt).getTime()) / 3600000 > t.slaHours).length
    const baselines = Object.keys(data.readiness.tripwireBaseline).filter(k => (data.readiness.tripwireBaseline[k] ?? '').trim()).length
    const sig: DeptSignal[] = [
      { label: 'Open tickets', value: String(openTickets), health: breaches > 0 ? 'alarm' : openTickets > 20 ? 'watch' : 'ok', detail: `${breaches} past SLA.` },
      { label: 'Offline baselines recorded', value: `${baselines}/8`, health: baselines === 0 ? 'alarm' : baselines < 8 ? 'watch' : 'ok', detail: 'A tripwire with no baseline cannot trip. These protect the ₹5.9L/month that pays today\'s salaries.' },
    ]
    out.push({
      def: DEPTS[3], health: worst(sig.map(s => s.health)),
      headline: baselines < 8 ? 'Offline tripwires are not yet armed' : 'Delivery and the offline ringfence holding',
      signals: sig,
      action: baselines < 8 ? 'Measure and record the offline baselines before anything changes — batch fill, walk-in response, fee income, NPS, faculty load.' : breaches ? 'Clear SLA breaches oldest-first.' : null,
      actionOwner: 'Ops lead', founderRequired: false,
      founderWhy: 'Ops lead measures and reports. The founder is needed only when a tripwire actually trips — then the pull-back is his call because it costs sprint capacity.',
    })
  }

  // ---- Finance
  {
    const cash = cashProjection(cfg, data, today)
    const runway = cash.runwayDays
    const sig: DeptSignal[] = [
      { label: 'Minimum projected cash', value: `₹${Math.round(cash.minCash).toLocaleString('en-IN')}`, health: cash.minCash < 0 ? 'critical' : cash.minCash < 500000 ? 'alarm' : 'ok', detail: runway ? `Goes negative on day ${runway} at plan burn.` : 'Stays positive across the sprint at plan burn.' },
      { label: 'Working capital deployable', value: `₹${(cfg.cash.workingCapitalAvailable / 100000).toFixed(1)}L`, health: cfg.cash.workingCapitalAvailable < 1800000 ? 'watch' : 'ok', detail: 'Reaching the run-rate needs ₹18–22L. Month 1 spends before Month 2 collects.' },
      { label: 'Kill switch signed', value: gate('G-F2') === 'passed' ? 'yes' : 'no', health: gate('G-F2') === 'passed' ? 'ok' : 'alarm', detail: 'The cash conditions under which the sprint slows, agreed in the calm rather than at Day 40.' },
    ]
    out.push({
      def: DEPTS[4], health: worst(sig.map(s => s.health)),
      headline: cash.minCash < 0 ? 'Cash goes negative at plan burn' : 'Cash holds at plan burn',
      signals: sig,
      action: gate('G-F2') !== 'passed' ? 'Minute the working-capital tranches and the kill switch before any spend scales.' : cash.minCash < 0 ? 'Raise working capital or slow the spend ramp — the plan currently runs the account negative.' : null,
      actionOwner: 'Founder + directors', founderRequired: true,
      founderWhy: 'Only the founder and directors can commit capital or agree the conditions under which the company stops spending. This one cannot be delegated.',
    })
  }

  // ---- HR
  {
    const joined = data.candidates.filter(c => !c.dropped && c.stage >= 4).length
    const pipeline = data.candidates.filter(c => !c.dropped && c.stage < 4).length
    const certified = data.trainees.filter(t => t.certified === 'passed').length
    const need = 6
    const sig: DeptSignal[] = [
      { label: 'Cohort 1 signed', value: `${joined}/${need}`, health: joined >= need ? 'ok' : pipeline > 0 ? 'watch' : 'alarm', detail: 'Source at 6× — six seats needs roughly 36 candidates. Offer-to-join runs 45–55% in tier-2 telesales.' },
      { label: 'In pipeline', value: String(pipeline), health: pipeline >= 12 ? 'ok' : pipeline > 0 ? 'watch' : 'alarm', detail: 'Twelve interviewed to yield six signed, plus a bench of three because 20% do not show.' },
      { label: 'Academy certified', value: String(certified), health: 'unknown', detail: 'No floor access without the Day-10 panel pass.' },
    ]
    out.push({
      def: DEPTS[5], health: worst(sig.map(s => s.health)),
      headline: joined >= need ? 'Cohort 1 is signed' : `${need - joined} more signed offers needed for Day 1`,
      signals: sig,
      action: joined < need ? 'Contract recruitment support now — Sanya cannot run a 36-candidate pipeline alongside payroll, registers and banking.' : 'Confirm every joiner by phone the day before.',
      actionOwner: 'Sanya + recruiter', founderRequired: true,
      founderWhy: 'Approving the recruitment-support engagement and countersigning offers is founder work. The pipeline itself is not.',
    })
  }

  // ---- Compliance
  {
    const signoff = data.signals.filter(s => s.status === 'awaiting_signoff').length
    const preflight = data.creatives.filter(c => c.status === 'preflight').length
    const overdue = data.grievances.filter(g => g.status === 'open' && g.dueAt <= today).length
    const g = gateHealth('compliance')
    const coNamed = !!cfg.entity.complianceOfficer.trim()
    const sig: DeptSignal[] = [
      { label: 'Compliance Officer named', value: coNamed ? cfg.entity.complianceOfficer : 'NOT NAMED', health: coNamed ? 'ok' : 'critical', detail: 'Mandatory for an RA. Several gates can only be signed by that named person, and the research line cannot open without one.' },
      { label: 'Awaiting analyst sign-off', value: String(signoff), health: signoff ? 'alarm' : 'ok', detail: 'Nothing reaches a client without a registered analyst\'s name and timestamp.' },
      { label: 'Pre-flight queue', value: String(preflight), health: preflight ? 'watch' : 'ok', detail: 'No creative goes live from the queue.' },
      { label: 'Overdue grievances', value: String(overdue), health: overdue ? 'critical' : 'ok', detail: 'Regulatory clocks are running.' },
      { label: 'Blocking gates', value: `${g.total - g.open}/${g.total}`, health: g.h, detail: 'Registration and officers, ad code and brand separation, recording and records.' },
    ]
    out.push({
      def: DEPTS[6], health: worst(sig.map(s => s.health)),
      headline: coNamed ? 'Machinery standing up' : 'No Compliance Officer named — this blocks half the revenue plan',
      signals: sig,
      action: !coNamed ? 'Pull the registration file and name the Compliance Officer and Principal Officer by board resolution.' : overdue ? 'Resolve or escalate every overdue grievance today.' : signoff ? 'Clear the sign-off queue — a named analyst must release it.' : null,
      actionOwner: 'Founder → Compliance Officer', founderRequired: !coNamed,
      founderWhy: !coNamed ? 'Only the founder can pull the registration file and pass a board resolution. Until the CO exists there is nobody to delegate compliance to.' : 'Once named, the Compliance Officer holds sole authority to block. The founder stays out of it — a CO who needs founder approval to say no is not a control.',
    })
  }

  // ---- Research
  {
    const analystNamed = data.signals.some(s => s.analyst) || false
    const released = data.signals.filter(s => s.status === 'released').length
    const sig: DeptSignal[] = [
      { label: 'Registered analyst on record', value: analystNamed ? 'yes' : 'NOT NAMED', health: analystNamed ? 'ok' : 'critical', detail: 'Zero named against two planned. Cannot be sourced, offered and joined inside the runway — structural, not effort.' },
      { label: 'Batches released', value: String(released), health: 'unknown', detail: 'Release is physically gated on analyst approval.' },
      { label: 'Forward paper log', value: 'starts T-13', health: 'watch', detail: 'Thirty unedited pre-open sessions are a launch threshold for the research SKUs. The clock only runs if entries are made every session.' },
    ]
    out.push({
      def: DEPTS[7], health: worst(sig.map(s => s.health)),
      headline: 'Research line cannot open until an analyst is named',
      signals: sig,
      action: 'Open the analyst search now, accepting it closes after Day 1, and start the forward paper log so the 30-session clock is running.',
      actionOwner: 'Harsh + Founder', founderRequired: true,
      founderWhy: 'Hiring a regulated role and signing the research go/defer decision are founder calls. Running the paper log daily is not.',
    })
  }

  return out
}

// ---------------------------------------------------------------------------
// The founder attention router
// ---------------------------------------------------------------------------

export interface FounderItem { dept: string; what: string; why: string; owner: string; urgency: Health }

export function founderDesk(statuses: DeptStatus[]): { needsHim: FounderItem[]; handled: FounderItem[] } {
  const needsHim: FounderItem[] = []
  const handled: FounderItem[] = []
  for (const s of statuses) {
    if (!s.action) {
      handled.push({ dept: s.def.name, what: 'Running to plan — nothing outstanding.', why: s.founderWhy, owner: s.def.ownerRole, urgency: s.health })
      continue
    }
    const item: FounderItem = { dept: s.def.name, what: s.action, why: s.founderWhy, owner: s.actionOwner, urgency: s.health }
    if (s.founderRequired) needsHim.push(item); else handled.push(item)
  }
  const rank: Record<Health, number> = { critical: 0, alarm: 1, watch: 2, ok: 3, unknown: 4 }
  needsHim.sort((a, b) => rank[a.urgency] - rank[b.urgency])
  handled.sort((a, b) => rank[a.urgency] - rank[b.urgency])
  return { needsHim, handled }
}

// ---------------------------------------------------------------------------
// The scaling map — where the business is, and what binds it at each stage
// ---------------------------------------------------------------------------

export interface ScaleStage {
  id: string; name: string; runRate: string; entry: string
  constraint: string; proves: string
}

export const SCALE_MAP: ScaleStage[] = [
  { id: 's0', name: 'Offline base', runRate: '≈ ₹5.9L/mo', entry: 'Where the business is today', constraint: 'Founder hours — he teaches, closes and approves everything', proves: 'The classroom product works and people pay for it' },
  { id: 's1', name: 'Machine fixed', runRate: '₹5–7L/mo', entry: 'Runway complete, gates passed, Day 1', constraint: 'Nothing is built yet — product and compliance are the binding constraints, not demand', proves: 'A compliant pitch exists, a course is deliverable, ads are verified' },
  { id: 's2', name: 'Desk A running', runRate: '₹9–12L/mo', entry: 'Cohort 1 certified and dialling', constraint: 'Closer capacity and lead quality — not lead volume, which is cheap', proves: 'A ₹1,999 course closes on one call at a repeatable rate' },
  { id: 's3', name: 'Desk B opened', runRate: '₹14–18L/mo', entry: 'A 30–90 day buyer base exists to work', constraint: 'Warm-base size — Desk B cannot outrun the buyers Desk A creates', proves: 'Half the target comes from people who already paid once' },
  { id: 's4', name: 'Research opened', runRate: '₹20–25L/mo', entry: 'Analyst named, CO named, back-test and forward log complete', constraint: 'Regulatory readiness, not sales capacity', proves: 'The firm can sell a research service a regulator could inspect' },
  { id: 's5', name: 'Repeatable', runRate: '₹25L+/mo', entry: 'Organic at 40%+ of leads, second face trained', constraint: 'Management depth — the founder must be removable from the daily loop', proves: 'The number survives the founder taking a week off' },
]

export function currentStage(cfg: Config, data: AppData, today: string): ScaleStage {
  const pace = pacing(cfg, data, today)
  const rr = pace.currentRunRate
  const analyst = data.signals.some(s => s.analyst)
  if (analyst && rr >= 1800000) return SCALE_MAP[4]
  if (rr >= 1300000) return SCALE_MAP[3]
  if (rr >= 800000) return SCALE_MAP[2]
  if (today <= cfg.prep.endDate) return SCALE_MAP[1]
  return SCALE_MAP[0]
}
