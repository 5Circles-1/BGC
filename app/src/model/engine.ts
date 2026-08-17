// The quant engine. Pure functions over Config + AppData — no I/O, no globals.
import type { AppData, Config, DailyLog, Family, Refund, Rep } from './types'
import { addDays, clamp, diffDays, isSunday, workingDaysBetween } from '../lib/format'

// ---------- Calendar ----------

export interface SprintCal {
  start: string; end: string; days: number
  today: string
  dayIndex: number            // 1-based; clamped to [0, days] (0 = before start)
  daysLeft: number
  weekIndex: number           // 1-based sprint week
  workingDaysTotal: number
  workingDaysElapsed: number  // up to & incl. today
  workingDaysLeft: number
}

export function sprintCal(cfg: Config, todayISO: string): SprintCal {
  const start = cfg.sprint.startDate
  const end = addDays(start, cfg.sprint.days - 1)
  const raw = diffDays(start, todayISO) + 1
  const dayIndex = clamp(raw, 0, cfg.sprint.days)
  const today = todayISO < start ? start : todayISO > end ? end : todayISO
  return {
    start, end, days: cfg.sprint.days, today,
    dayIndex,
    daysLeft: cfg.sprint.days - dayIndex,
    weekIndex: Math.max(1, Math.ceil(dayIndex / 7)),
    workingDaysTotal: workingDaysBetween(start, end),
    workingDaysElapsed: dayIndex === 0 ? 0 : workingDaysBetween(start, today),
    workingDaysLeft: dayIndex >= cfg.sprint.days ? 0 : workingDaysBetween(addDays(today, 1), end),
  }
}

export function sprintWeekOf(cfg: Config, dateISO: string): number {
  return Math.max(1, Math.ceil((diffDays(cfg.sprint.startDate, dateISO) + 1) / 7))
}

// ---------- Plan / mix ----------

export function planRevenueMonthly(cfg: Config): { total: number; deskA: number; deskB: number; byProduct: Record<string, number> } {
  const byProduct: Record<string, number> = {}
  let deskA = 0, deskB = 0
  for (const p of cfg.products) {
    const r = p.priceInclGst * p.unitsPlanMonthly
    byProduct[p.id] = r
    if (p.desk === 'A') deskA += r; else deskB += r
  }
  return { total: deskA + deskB, deskA, deskB, byProduct }
}

/** Blended value of one anchor sale, including its checkout add-on at take rate. */
export function blendedAovP1(cfg: Config): number {
  const anchor = anchorProduct(cfg)
  const bump = cfg.products.find(p => p.id === cfg.bumpProductId)
  return (anchor?.priceInclGst ?? 0) + (bump ? bump.priceInclGst * cfg.funnel.bumpTakeRate : 0)
}

/** The product the funnel is solved against. Falls back to the biggest Desk A line. */
export function anchorProduct(cfg: Config) {
  return cfg.products.find(p => p.id === cfg.anchorProductId)
    ?? [...cfg.products].filter(p => p.desk === 'A').sort((a, b) => b.unitsPlanMonthly - a.unitsPlanMonthly)[0]
    ?? cfg.products[0]
}

export function netLeadToSale(cfg: Config): number {
  const f = cfg.funnel
  return f.connectRate * f.qualRate * f.closeRate
}

// ---------- Reverse funnel solver ----------

export interface SolveResult {
  targetMonthly: number
  unitsMonthly: Record<string, number>
  p1Units: number
  leadsMonthly: number; leadsDaily: number
  paidLeadsMonthly: number; adSpendMonthly: number
  dialsDaily: number
  closersA: number; closersB: number
  net: number
}

/** Solve backwards from a monthly collections target, holding the plan's product mix. */
export function solveFunnel(cfg: Config, targetMonthly: number, overrides?: { closeRate?: number; cpl?: number; aov?: number }): SolveResult {
  const plan = planRevenueMonthly(cfg)
  const scale = targetMonthly / plan.total
  const unitsMonthly: Record<string, number> = {}
  for (const p of cfg.products) unitsMonthly[p.id] = p.unitsPlanMonthly * scale

  const f = cfg.funnel
  const close = overrides?.closeRate ?? f.closeRate
  const net = f.connectRate * f.qualRate * close
  const aovAdj = overrides?.aov ? overrides.aov / blendedAovP1(cfg) : 1
  const p1Units = (unitsMonthly[anchorProduct(cfg).id] ?? 0) / aovAdj
  const leadsMonthly = net > 0 ? p1Units / net : Infinity
  const paidLeads = leadsMonthly * f.paidLeadShare
  const cpl = overrides?.cpl ?? f.cplBlended
  const wd = cfg.target.workingDaysPerMonth

  // Desk A closers: ramped rep sells p1PerDayRamped/day
  const aSalesPerRepMonthly = cfg.desks.A.p1PerDayRamped * wd
  const closersA = aSalesPerRepMonthly > 0 ? p1Units / aSalesPerRepMonthly : 0
  // Desk B closers by revenue capacity
  const bRevenue = Object.entries(unitsMonthly).reduce((s, [id, u]) => {
    const p = cfg.products.find(x => x.id === id)!
    return p.desk === 'B' ? s + u * p.priceInclGst : s
  }, 0)
  const closersB = cfg.desks.B.revenuePerMonth > 0 ? bRevenue / cfg.desks.B.revenuePerMonth : 0

  return {
    targetMonthly, unitsMonthly, p1Units,
    leadsMonthly, leadsDaily: leadsMonthly / wd,
    paidLeadsMonthly: paidLeads, adSpendMonthly: paidLeads * cpl,
    dialsDaily: (leadsMonthly / wd) * 2.2, // each lead worked ≈ 2.2 dial attempts across the cadence
    closersA, closersB, net,
  }
}

// ---------- Ramp & capacity ----------

/** % of full output for a rep whose effective tenure is `weeks` (1-based), with a speed multiplier. */
export function rampPct(cfg: Config, weeksSinceJoin: number, rampMult = 1): number {
  if (weeksSinceJoin <= 0) return 0
  const curve = cfg.ramp.curveByWeek
  const eff = weeksSinceJoin * rampMult
  const idx = Math.floor(eff) - 1
  if (idx >= curve.length) return curve[curve.length - 1]
  if (idx < 0) return curve[0] * Math.min(1, eff)
  return curve[idx]
}

function weeksSince(joinDate: string, date: string): number {
  return Math.floor(diffDays(joinDate, date) / 7) + 1
}

/** Desk capacity on a given date (per working day). */
export function capacityOn(cfg: Config, reps: Rep[], date: string, opts?: { rampMult?: number; joinDelayDays?: number; includePlanned?: boolean }) {
  const rampMult = opts?.rampMult ?? 1
  let p1PerDay = 0, bRevPerDay = 0, aCount = 0, bCount = 0
  for (const r of reps) {
    if (!r.active) continue
    if (r.planned && opts?.includePlanned === false) continue
    const join = r.planned && opts?.joinDelayDays ? addDays(r.joinDate, Math.round(opts.joinDelayDays)) : r.joinDate
    if (join > date) continue
    const w = weeksSince(join, date)
    const pct = rampPct(cfg, w, rampMult) / 100
    if (r.desk === 'A') { p1PerDay += cfg.desks.A.p1PerDayRamped * pct; aCount++ }
    else { bRevPerDay += (cfg.desks.B.revenuePerMonth / cfg.target.workingDaysPerMonth) * pct; bCount++ }
  }
  return { p1PerDay, bRevPerDay, aCount, bCount }
}

// ---------- Sprint forecast (bottom-up) ----------

export interface ForecastOpts {
  closeMult?: number; cplMult?: number; rampMult?: number; aovMult?: number
  organicMult?: number; deskBMult?: number; joinDelayDays?: number
  includePlanned?: boolean
}

export interface WeekRow {
  week: number; days: number
  spend: number; leads: number
  p1Demand: number; p1Capacity: number; p1Sales: number
  revenueA: number; revenueB: number; revenue: number
  runRate: number
}

export interface Forecast {
  weeks: WeekRow[]
  sprintTotal: number
  month1: number
  day60RunRate: number
  hitsTarget: boolean
}

const EXISTING_WARM_POOL = 400        // pre-sprint buyer base workable by Desk B
const WARM_YIELD_PER_BUYER = 1600     // ₹/mo per buyer aged into the 30–90d pool

export function forecastSprint(cfg: Config, reps: Rep[], opts: ForecastOpts = {}): Forecast {
  const o = { closeMult: 1, cplMult: 1, rampMult: 1, aovMult: 1, organicMult: 1, deskBMult: 1, joinDelayDays: 0, includePlanned: true, ...opts }
  const totalWeeks = Math.ceil(cfg.sprint.days / 7)
  const net = netLeadToSale(cfg) * o.closeMult
  const aov = blendedAovP1(cfg) * o.aovMult
  // Everything else Desk A sells rides along with the anchor at its planned ratio,
  // so adding or renaming an attach product needs no code change.
  const anchorId = anchorProduct(cfg).id
  const attachA = cfg.products.filter(p => p.desk === 'A' && p.id !== anchorId && p.id !== cfg.bumpProductId)
    .map(p => ({ price: p.priceInclGst, ratio: ratioToP1(cfg, p.id) }))

  const weeks: WeekRow[] = []
  let cumP1 = 0
  let cumRevenue = 0
  let month1 = 0
  const p1History: number[] = []

  for (let w = 1; w <= totalWeeks; w++) {
    const daysInWeek = Math.min(7, cfg.sprint.days - (w - 1) * 7)
    const workDays = Math.round(daysInWeek * 6 / 7)
    const tranche = cfg.spendRampMonthly.find(t => w <= t.uptoWeek) ?? cfg.spendRampMonthly[cfg.spendRampMonthly.length - 1]
    const spend = tranche.monthly / 4.33 * (daysInWeek / 7)
    const paidLeads = spend / (cfg.funnel.cplBlended * o.cplMult)
    const organicRampUp = Math.min(1, 0.35 + 0.11 * w)
    const organic = (cfg.mc.organicLeadsMonthly * o.organicMult / 4.33) * organicRampUp * (daysInWeek / 7)
    const leads = paidLeads + organic

    const midDate = addDays(cfg.sprint.startDate, (w - 1) * 7 + Math.floor(daysInWeek / 2))
    const cap = capacityOn(cfg, reps, midDate, { rampMult: o.rampMult, joinDelayDays: o.joinDelayDays, includePlanned: o.includePlanned })

    const p1Demand = leads * net
    const p1Capacity = cap.p1PerDay * workDays
    const p1Sales = Math.min(p1Demand, p1Capacity)

    const revenueA = p1Sales * aov
      + attachA.reduce((sum, a) => sum + p1Sales * a.ratio * a.price, 0)

    // Desk B works the warm pool: buyers aged 30–90 days (≈ trailing weeks 5–13) + the pre-sprint base
    const pool = EXISTING_WARM_POOL + p1History.slice(-13, -4).reduce((s, x) => s + x, 0)
    const warmCeiling = pool * WARM_YIELD_PER_BUYER / 4.33 * (daysInWeek / 7)
    const revenueB = Math.min(cap.bRevPerDay * workDays * o.deskBMult, warmCeiling)

    const revenue = revenueA + revenueB
    cumRevenue += revenue
    cumP1 += p1Sales
    p1History.push(p1Sales)
    if (w <= 4) month1 += revenue
    if (w === 5) month1 += revenue * (2 / 7)

    weeks.push({ week: w, days: daysInWeek, spend, leads, p1Demand, p1Capacity, p1Sales, revenueA, revenueB, revenue, runRate: revenue / daysInWeek * 30.4 })
  }

  const last = weeks[weeks.length - 1]
  const day60RunRate = last.runRate
  const targetEff = cfg.target.basis === 'net' ? cfg.target.monthlyRunRate * (1 + cfg.target.gstRate) : cfg.target.monthlyRunRate
  return { weeks, sprintTotal: cumRevenue, month1, day60RunRate, hitsTarget: day60RunRate >= targetEff }
}

function ratioToP1(cfg: Config, id: string): number {
  const anchor = anchorProduct(cfg)
  const p = cfg.products.find(x => x.id === id)
  return anchor && anchor.unitsPlanMonthly > 0 && p ? p.unitsPlanMonthly / anchor.unitsPlanMonthly : 0
}

// ---------- Pacing ----------

export interface Pacing {
  requiredCumToday: number
  actualCumToday: number
  variance: number
  requiredPerRemainingWD: number
  plannedSprintTotal: number
  currentRunRate: number      // trailing working-week collections annualised to a month
  targetRunRateEff: number
  curve: { date: string; day: number; required: number; actual: number | null }[]
}

export function requiredCumAt(cfg: Config, dateISO: string): number {
  // Integrate the weekly run-rate plan over working days.
  const start = cfg.sprint.startDate
  let cum = 0
  for (let d = start; d <= dateISO; d = addDays(d, 1)) {
    if (isSunday(d)) continue
    const w = Math.min(sprintWeekOf(cfg, d), cfg.target.runRatePlanWeekly.length)
    cum += cfg.target.runRatePlanWeekly[w - 1] / cfg.target.workingDaysPerMonth
  }
  return cum
}

export function collectionsOf(log: DailyLog | undefined): number {
  if (!log) return 0
  return Object.values(log.collections).reduce<number>((s, v) => s + (v || 0), 0)
}

export function pacing(cfg: Config, data: AppData, todayISO: string): Pacing {
  const cal = sprintCal(cfg, todayISO)
  const end = cal.end
  const curve: Pacing['curve'] = []
  let requiredCum = 0, actualCum = 0
  let requiredCumToday = 0, actualCumToday = 0
  for (let d = cal.start, i = 1; d <= end; d = addDays(d, 1), i++) {
    if (!isSunday(d)) {
      const w = Math.min(sprintWeekOf(cfg, d), cfg.target.runRatePlanWeekly.length)
      requiredCum += cfg.target.runRatePlanWeekly[w - 1] / cfg.target.workingDaysPerMonth
    }
    const isPast = d <= cal.today
    if (isPast) actualCum += collectionsOf(data.daily[d])
    if (d === cal.today) { requiredCumToday = requiredCum; actualCumToday = actualCum }
    curve.push({ date: d, day: i, required: requiredCum, actual: isPast ? actualCum : null })
  }
  if (todayISO < cal.start) { requiredCumToday = 0; actualCumToday = 0 }   // sprint not started yet
  const plannedSprintTotal = requiredCum
  const remainingRequired = plannedSprintTotal - actualCumToday
  const requiredPerRemainingWD = cal.workingDaysLeft > 0 ? Math.max(0, remainingRequired) / cal.workingDaysLeft : 0

  // Current run-rate: trailing 7 working days
  let trail = 0, wd = 0
  for (let d = cal.today; wd < 7 && d >= cal.start; d = addDays(d, -1)) {
    if (isSunday(d)) continue
    trail += collectionsOf(data.daily[d]); wd++
  }
  const currentRunRate = wd > 0 ? (trail / wd) * cfg.target.workingDaysPerMonth : 0
  const targetRunRateEff = cfg.target.basis === 'net' ? cfg.target.monthlyRunRate * (1 + cfg.target.gstRate) : cfg.target.monthlyRunRate

  return { requiredCumToday, actualCumToday, variance: actualCumToday - requiredCumToday, requiredPerRemainingWD, plannedSprintTotal, currentRunRate, targetRunRateEff, curve }
}

// ---------- Sensitivity ----------

export interface SensRow { lever: string; kind: 'closeMult' | 'cplMult' | 'aovMult' | 'rampMult'; deltas: { pct: number; day60: number; sprint: number }[] }

export function sensitivity(cfg: Config, reps: Rep[]): { base: Forecast; rows: SensRow[] } {
  const base = forecastSprint(cfg, reps)
  const levers: SensRow[] = (
    [
      ['Close rate', 'closeMult'], ['CPL (cost per lead)', 'cplMult'],
      ['AOV (P1 blended)', 'aovMult'], ['Ramp speed', 'rampMult'],
    ] as [string, SensRow['kind']][]
  ).map(([lever, kind]) => ({
    lever, kind,
    deltas: [-0.2, -0.1, 0.1, 0.2].map(pct => {
      // For CPL, +10% cost is adverse; multiplier applies directly to cost.
      const f = forecastSprint(cfg, reps, { [kind]: 1 + pct } as ForecastOpts)
      return { pct, day60: f.day60RunRate - base.day60RunRate, sprint: f.sprintTotal - base.sprintTotal }
    }),
  }))
  return { base, rows: levers }
}

// ---------- Fee cap ----------

export interface CapStatus {
  family: Family
  usedExGst: number          // rolling 12 months, research services only
  capacity: number
  headroom: number
  breached: boolean
}

export function familyCapStatus(cfg: Config, family: Family, onDate: string): CapStatus {
  const from = addDays(onDate, -365)
  const usedExGst = family.charges
    .filter(c => c.date > from && c.date <= onDate)
    .filter(c => cfg.products.find(p => p.id === c.productId)?.countsTowardCap)
    .reduce((s, c) => s + c.amountInclGst / (1 + cfg.target.gstRate), 0)
  const capacity = cfg.feeCap.capPerFamilyYear
  return { family, usedExGst, capacity, headroom: capacity - usedExGst, breached: usedExGst > capacity }
}

export interface GateCheck { allowed: boolean; reasons: string[]; headroomAfter: number }

/** The payment-link gate: run BEFORE generating any payment link for an individual/HUF family. */
export function paymentLinkGate(cfg: Config, family: Family, productId: string, amountInclGst: number, onDate: string): GateCheck {
  const product = cfg.products.find(p => p.id === productId)
  const reasons: string[] = []
  if (!product) return { allowed: false, reasons: ['Unknown product.'], headroomAfter: 0 }
  const st = familyCapStatus(cfg, family, onDate)
  let headroomAfter = st.headroom
  if (product.countsTowardCap && !family.accredited) {
    const exGst = amountInclGst / (1 + cfg.target.gstRate)
    headroomAfter = st.headroom - exGst
    if (exGst > st.headroom) reasons.push(`Exceeds ₹${cfg.feeCap.capPerFamilyYear.toLocaleString('en-IN')} family cap: headroom ₹${Math.max(0, Math.round(st.headroom)).toLocaleString('en-IN')} vs charge ₹${Math.round(exGst).toLocaleString('en-IN')} ex-GST.`)
  }
  if (product.termMonths > cfg.feeCap.advanceMaxMonths) {
    reasons.push(`Advance fee beyond ${cfg.feeCap.advanceMaxMonths} months is not permitted (product term ${product.termMonths}m).`)
  }
  return { allowed: reasons.length === 0, reasons, headroomAfter }
}

/** Pro-rata refund of the unexpired period. Breakage fee is always ₹0 for RA services. */
export function proRataRefund(cfg: Config, productId: string, amountPaid: number, saleDate: string, terminationDate: string): { refund: number; usedDays: number; termDays: number } {
  const product = cfg.products.find(p => p.id === productId)
  const termDays = (product?.termMonths || 0) * 30.4
  if (!product || termDays <= 0) return { refund: 0, usedDays: 0, termDays: 0 }
  const usedDays = clamp(diffDays(saleDate, terminationDate), 0, termDays)
  const refund = amountPaid * (1 - usedDays / termDays)
  return { refund, usedDays, termDays: Math.round(termDays) }
}

// ---------- Payroll & incentives ----------

export interface PayrollRow {
  rep: Rep; fixed: number; p1Units: number; scannerAnnualUnits: number; bCollections: number
  incentive: number; clawback: number; total: number
}

export function payrollForMonth(cfg: Config, data: AppData, monthPrefix: string): PayrollRow[] {
  const days = Object.values(data.daily).filter(d => d.date.startsWith(monthPrefix))
  const rows: PayrollRow[] = []
  for (const rep of data.reps.filter(r => !r.planned)) {
    let p1 = 0, scanAnnual = 0, bColl = 0
    for (const d of days) {
      const rd = d.reps[rep.id]
      if (!rd) continue
      if (rep.desk === 'A') {
        p1 += rd.sales
        const totalUnits = Object.entries(d.units).reduce((s, [, v]) => s + (v || 0), 0)
        const annualSaasIds = cfg.products.filter(p => p.regClass === 'saas' && p.termMonths >= 12).map(p => p.id)
        const p2bU = annualSaasIds.reduce<number>((a, id) => a + (d.units[id] || 0), 0)
        // attribute desk-level scanner annuals pro-rata to sellers by their share of sales
        const daySales = Object.values(d.reps).reduce((s, x) => s + x.sales, 0)
        if (daySales > 0 && totalUnits > 0) scanAnnual += p2bU * (rd.sales / daySales)
      } else {
        bColl += rd.revenue
      }
    }
    const fixed = rep.desk === 'A' ? cfg.comp.deskAFixed : cfg.comp.deskBFixed
    const incentive = rep.desk === 'A'
      ? p1 * cfg.comp.deskAPerP1 + scanAnnual * cfg.comp.deskAPerScannerAnnual
      : bColl * cfg.comp.deskBPctP3P4
    const clawback = data.refunds
      .filter(r => r.repId === rep.id && r.status !== 'requested' && r.date.startsWith(monthPrefix))
      .filter(r => diffDays(r.saleDate, r.date) <= cfg.comp.clawbackDays)
      .reduce((s, r) => {
        const p = cfg.products.find(p => p.id === r.productId)
        if (!p) return s
        if (rep.desk === 'B') return s + r.amount * cfg.comp.deskBPctP3P4
        if (p.id === cfg.anchorProductId) return s + cfg.comp.deskAPerP1
        if (p.regClass === 'saas' && p.termMonths >= 12) return s + cfg.comp.deskAPerScannerAnnual
        return s
      }, 0)
    rows.push({ rep, fixed, p1Units: p1, scannerAnnualUnits: Math.round(scanAnnual * 10) / 10, bCollections: bColl, incentive, clawback, total: fixed + incentive - clawback })
  }
  return rows
}

// ---------- Cash runway ----------

export interface CashPoint { date: string; day: number; cash: number }

export function cashProjection(cfg: Config, data: AppData, todayISO: string): { points: CashPoint[]; runwayDays: number | null; minCash: number } {
  const cal = sprintCal(cfg, todayISO)
  const fixedMonthlyExMarketing = cfg.opex.filter(o => !/marketing|ad spend/i.test(o.name)).reduce((s, o) => s + o.monthly, 0)
  let cash = cfg.cash.openingCash + cfg.cash.workingCapitalAvailable
  const fc = forecastSprint(cfg, data.reps)
  const points: CashPoint[] = []
  let runwayDays: number | null = null
  let minCash = cash
  for (let d = cal.start, i = 1; d <= cal.end; d = addDays(d, 1), i++) {
    const isPast = d <= cal.today
    const w = Math.min(sprintWeekOf(cfg, d), fc.weeks.length)
    const wk = fc.weeks[w - 1]
    const inflow = isPast ? collectionsOf(data.daily[d]) : wk.revenue / wk.days
    const spendPlanned = wk.spend / wk.days
    const spendActual = isPast ? Object.values(data.daily[d]?.spend ?? {}).reduce<number>((s, v) => s + (v || 0), 0) : spendPlanned
    const outflow = spendActual + fixedMonthlyExMarketing / 30.4
    cash += inflow - outflow
    minCash = Math.min(minCash, cash)
    if (cash < 0 && runwayDays === null) runwayDays = i
    points.push({ date: d, day: i, cash })
  }
  return { points, runwayDays, minCash }
}

// ---------- Channel risk ----------

export function channelRisk(h: { accountStatus: string; verificationDone: boolean; siPortalMatched: boolean; disapprovalPct: number; appealOpen: boolean }): { score: number; band: 'low' | 'elevated' | 'high' | 'critical' } {
  let score =
    h.accountStatus === 'banned' ? 100 :
    h.accountStatus === 'in_review' ? 55 :
    h.accountStatus === 'limited' ? 45 : 10
  if (!h.verificationDone) score += 25
  if (!h.siPortalMatched) score += 12
  score += Math.min(20, h.disapprovalPct * 2)
  if (h.appealOpen) score += 8
  score = clamp(score, 0, 100)
  return { score, band: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'elevated' : 'low' }
}

// ---------- Daily variance & task generation ----------

export interface VarianceLine { metric: string; plan: string; actual: string; ok: boolean; note?: string }

export function dayVariance(cfg: Config, data: AppData, date: string): VarianceLine[] {
  const log = data.daily[date]
  const w = Math.min(sprintWeekOf(cfg, date), cfg.target.runRatePlanWeekly.length)
  const reqToday = cfg.target.runRatePlanWeekly[w - 1] / cfg.target.workingDaysPerMonth
  const solved = solveFunnel(cfg, cfg.target.runRatePlanWeekly[w - 1])
  const coll = collectionsOf(log)
  const lines: VarianceLine[] = []
  const push = (metric: string, plan: string, actual: string, ok: boolean, note?: string) => lines.push({ metric, plan, actual, ok, note })
  push('Collections', `₹${Math.round(reqToday).toLocaleString('en-IN')}`, `₹${Math.round(coll).toLocaleString('en-IN')}`, coll >= reqToday * 0.9)
  push('Leads in', `${Math.round(solved.leadsDaily)}`, `${log?.leadsIn ?? 0}`, (log?.leadsIn ?? 0) >= solved.leadsDaily * 0.85)
  push('Dials', `${Math.round(solved.dialsDaily)}`, `${log?.dials ?? 0}`, (log?.dials ?? 0) >= solved.dialsDaily * 0.85)
  const stl = log?.speedToLeadMedianMin
  push('Speed-to-lead (median)', `≤ ${cfg.funnel.speedToLeadTargetMin} min`, stl == null ? '—' : `${stl} min`, stl != null && stl <= cfg.funnel.speedToLeadTargetMin)
  const spend = Object.values(log?.spend ?? {}).reduce<number>((s, v) => s + (v || 0), 0)
  const tranche = cfg.spendRampMonthly.find(t => w <= t.uptoWeek) ?? cfg.spendRampMonthly[cfg.spendRampMonthly.length - 1]
  const spendPlan = tranche.monthly / cfg.target.workingDaysPerMonth
  push('Ad spend', `₹${Math.round(spendPlan).toLocaleString('en-IN')}`, `₹${Math.round(spend).toLocaleString('en-IN')}`, spend <= spendPlan * 1.25)
  const conn = log && log.dials > 0 ? log.connects / log.dials : null
  push('Connect rate', `${Math.round(cfg.funnel.connectRate * 100)}%`, conn == null ? '—' : `${Math.round(conn * 100)}%`, conn != null && conn >= cfg.funnel.connectRate * 0.85)
  return lines
}

export function generateTasks(cfg: Config, data: AppData, forDate: string, prevDate: string): { fn: string; text: string }[] {
  const out: { fn: string; text: string }[] = []
  const v = dayVariance(cfg, data, prevDate)
  const log = data.daily[prevDate]
  const bad = (m: string) => v.find(x => x.metric === m && !x.ok)

  if (bad('Collections')) out.push({ fn: 'sales', text: `Recover collections gap from ${prevDate}: pull tomorrow's follow-up cadence forward; TLs run midday pacing check at 13:00 against the daily line.` })
  if (bad('Leads in')) out.push({ fn: 'marketing', text: 'Lead volume below plan: check channel disapprovals & budgets, shift spend to the best CPL channel, ship 2 fresh hooks to preflight.' })
  if (bad('Speed-to-lead (median)')) out.push({ fn: 'sales', text: `Speed-to-lead breached ${cfg.funnel.speedToLeadTargetMin} min: fix router/queue first thing; TL owns the clock on screen; report median at the 13:00 check.` })
  if (bad('Dials')) out.push({ fn: 'sales', text: 'Dial count under plan: floor huddle on dialler discipline; check absences; qualifiers pre-screen so closers dial A-grades first.' })
  if (bad('Connect rate')) out.push({ fn: 'sales', text: 'Connect rate soft: rotate calling windows (11–1, 4–7), refresh number pools, and re-verify WhatsApp opt-in flows.' })
  if (bad('Ad spend')) out.push({ fn: 'marketing', text: 'Spend above tranche: rein daily budgets back to plan — the ramp earns the right to spend; it never buys through a broken rate.' })

  const missing = (['sales', 'marketing', 'finance', 'operations'] as const).filter(fn => !log?.eod?.[fn])
  if (missing.length) out.push({ fn: 'management', text: `EOD updates missing from ${missing.join(', ')} for ${prevDate}. A missing number is treated exactly like a bad number — chase at the 09:00 huddle.` })

  for (const b of data.signals.filter(s => s.status === 'awaiting_signoff')) out.push({ fn: 'research', text: `Signal batch "${b.title}" awaits analyst sign-off — nothing releases without a name and timestamp on it.` })

  const overdueGriev = data.grievances.filter(g => g.status === 'open' && g.dueAt <= forDate)
  for (const g of overdueGriev) out.push({ fn: 'compliance', text: `Grievance ${g.id.slice(-4).toUpperCase()} (${g.channel}) is past due — resolve or escalate today.` })

  const pendingPreflight = data.creatives.filter(c => c.status === 'preflight').length
  if (pendingPreflight) out.push({ fn: 'compliance', text: `${pendingPreflight} creative(s) in the pre-flight queue — clear before today's 17:00 campaign review.` })

  const unprovisioned = data.clients.filter(c => !c.provisioned && c.products.some(p => p === 'p2c' || p === 'p3'))
  const blocked = unprovisioned.filter(c => !(c.kyc && c.agreement && c.riskProfile))
  if (blocked.length) out.push({ fn: 'operations', text: `${blocked.length} research client(s) blocked on KYC/agreement/risk profile — chase documents; access stays locked until complete.` })

  if (!out.length) out.push({ fn: 'management', text: 'All metrics on plan yesterday. Push the advantage: raise today’s stretch by 10% and bank the surplus.' })
  return out
}

// ---------- Week helpers ----------

export function weekKeyOf(cfg: Config, dateISO: string): string {
  return `W${String(sprintWeekOf(cfg, dateISO)).padStart(2, '0')}`
}
