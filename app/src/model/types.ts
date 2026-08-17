// The OPERATOR data model. Config is the editable "model"; collections are the
// operating records. Everything persists via lib/storage under bos:* keys.

/** Free-form so the ladder can carry the firm's own product names. */
export type ProductId = string
export type Desk = 'A' | 'B'
export type RegClass = 'education' | 'saas' | 'research'
export type Fn = 'sales' | 'marketing' | 'hr' | 'operations' | 'finance' | 'compliance' | 'research' | 'management'

export interface Product {
  id: ProductId
  name: string
  short: string
  priceInclGst: number
  unitsPlanMonthly: number
  desk: Desk
  regClass: RegClass
  countsTowardCap: boolean   // ₹1,51,000/family/yr — research services only
  termMonths: number         // service period for pro-rata refunds (0 = one-time)
  /** Sellable on Day 1? Anything false is deferred and shows as such everywhere. */
  shipsDay1: boolean
  note?: string
}

export interface ChannelDef {
  id: string
  name: string
  spendPlanMonthly: number
  cplTarget: number
  paid: boolean
}

export interface HeadcountLine { fn: Fn | 'technology'; role: string; planned: number }

export interface Config {
  entity: {
    legalName: string; brand: string; sebiReg: string; cin: string
    registeredOffice: string; corporateOffice: string
    complianceOfficer: string; principalOfficer: string
    regType: 'non-individual' | 'individual' | 'unconfirmed'
  }
  /** The T-15 → T-0 readiness runway that precedes Day 1. */
  prep: { startDate: string; endDate: string }
  sprint: { startDate: string; days: number }
  target: {
    monthlyRunRate: number          // ₹25,00,000 at Day 60
    basis: 'gross' | 'net'          // gross = incl. GST (default)
    gstRate: number                 // 0.18
    workingDaysPerMonth: number     // 26 (Mon–Sat)
    runRatePlanWeekly: number[]     // planned monthly run-rate at each sprint week (the pacing spine)
  }
  /** The product the acquisition funnel is solved against, and its checkout bump. */
  anchorProductId: string
  bumpProductId: string
  funnel: {
    connectRate: number; qualRate: number; closeRate: number
    cplBlended: number; paidLeadShare: number
    speedToLeadTargetMin: number
    bumpTakeRate: number            // P1b attach on P1
  }
  products: Product[]
  desks: {
    A: { dialsPerDayRamped: number; dialsPerDayM1: number; p1PerDayRamped: number; p1PerDayM1: number }
    B: { dialsPerDayRamped: number; p3PerMonth: number; p4aPerMonth: number; revenuePerMonth: number }
  }
  ramp: { curveByWeek: number[] }   // % of full output by week since join, e.g. [45,45,70,70,90,90,100]
  comp: {
    deskAFixed: number; deskAPerP1: number; deskAPerScannerAnnual: number
    deskBFixed: number; deskBPctP3P4: number
    clawbackDays: number
  }
  headcountPlan: HeadcountLine[]
  channels: ChannelDef[]
  spendRampMonthly: { uptoWeek: number; monthly: number }[]   // ad-spend tranches
  opex: { name: string; monthly: number }[]
  cash: { openingCash: number; workingCapitalAvailable: number; runwayAlertDays: number }
  feeCap: { capPerFamilyYear: number; advanceMaxMonths: number }
  mc: {
    runs: number
    sdClose: number; sdCpl: number; sdRamp: number; sdAov: number
    organicLeadsMonthly: number
  }
}

// ---- Operating records ----

export interface Rep {
  id: string; name: string; desk: Desk; joinDate: string; active: boolean
  planned?: boolean          // future join baked into the forecast, not yet on floor
  isTL?: boolean; notes?: string
}

export interface RepDay { dials: number; connects: number; quals: number; sales: number; revenue: number; talkMin?: number; qaScore?: number }

export interface DailyLog {
  date: string
  units: Partial<Record<ProductId, number>>
  collections: Partial<Record<ProductId, number>>   // ₹ received (basis: gross incl. GST)
  leadsIn: number
  /** Leads actually dispositioned. leadsIn − leadsWorked is the backlog that killed July. */
  leadsWorked?: number
  leadsBySource: Record<string, number>
  spend: Record<string, number>
  dials: number; connects: number; quals: number
  speedToLeadMedianMin: number | null
  reps: Record<string, RepDay>
  notes: Partial<Record<Fn, string>>
  eod: Partial<Record<Fn, boolean>>                 // which functions submitted
  locked: boolean
  lockedAt?: string
}

export const HIRING_STAGES = ['Sourced', 'Screened', 'Interviewed', 'Offered', 'Joined', 'Trained', 'Certified', 'Ramped', 'Productive'] as const
export interface Candidate {
  id: string; role: string; name: string; source: string
  stage: number; enteredStageAt: string; history: { stage: number; at: string }[]
  dropped?: boolean; notes?: string
}

export interface Trainee {
  id: string; name: string; cohort: number; startDate: string
  quiz: Record<number, number | undefined>          // day → score %
  practical: Record<number, boolean | undefined>    // day 4,5,6,7,8 gates
  certified: 'pending' | 'passed' | 'failed'
  firstSaleDate?: string; repId?: string
}

export interface FamilyCharge { id: string; date: string; productId: ProductId; amountInclGst: number; note?: string }
export interface Family {
  id: string; code: string; label: string; members: number
  accredited: boolean
  charges: FamilyCharge[]
}

export interface ClientCompliance {
  id: string; code: string
  kyc: boolean; agreement: boolean; riskProfile: boolean
  products: ProductId[]
  provisioned: boolean
  updatedAt: string
}

export interface SignalBatch {
  id: string; date: string; title: string; items: number
  product: 'p2c' | 'p3'
  status: 'draft' | 'awaiting_signoff' | 'approved' | 'released' | 'rejected'
  analyst?: string; signedAt?: string; releasedAt?: string; note?: string
}

export const PREFLIGHT_CHECKS = [
  'No return / performance claim (no "double", "sure-shot", "guaranteed", "risk-free")',
  'No P&L / broker-terminal / balance screenshots',
  'No stock name with price target in the ad',
  'No testimonial referencing profit amounts',
  'No loss-from-inaction urgency framing',
  'Carries name-as-registered, SEBI reg no., registered office, brand, CIN',
  'Carries accuracy declaration',
  'Market-risk warning present at ≥10pt',
  'Correct brand (education ≠ research) and correct ad account',
] as const

export interface Creative {
  id: string; name: string; channelId: string; brand: 'education' | 'research'
  lang: 'hi' | 'en' | 'hi-en'; angle: string
  status: 'draft' | 'preflight' | 'approved' | 'rejected' | 'live' | 'archived'
  checks: boolean[]
  approver?: string; approvedAt?: string
  spend?: number; leads?: number
  createdAt: string
}

export interface ChannelHealth {
  channelId: string
  accountStatus: 'healthy' | 'limited' | 'in_review' | 'banned'
  verificationDone: boolean
  siPortalMatched: boolean
  disapprovalPct: number
  appealOpen: boolean
  lastChecked: string
  note?: string
}

export interface Ticket { id: string; openedAt: string; type: string; priority: 'P1' | 'P2' | 'P3'; status: 'open' | 'closed'; slaHours: number; closedAt?: string }

export interface Grievance {
  id: string; openedAt: string; channel: 'direct' | 'SCORES'; summary: string
  status: 'open' | 'resolved'; dueAt: string; closedAt?: string
}

export interface Refund {
  id: string; date: string; productId: ProductId; amount: number
  saleDate: string; repId?: string; familyCode?: string
  reason: string; status: 'requested' | 'approved' | 'paid'
  proRataOfTerm: boolean
}

export interface AgentRun { at: string; by: string; note: string }
export interface AgentState { promptOverride?: string; runs: AgentRun[] }

export interface TaskItem { id: string; date: string; fn: Fn; text: string; done: boolean; source: 'auto' | 'manual' }

export interface ExerciseLogEntry { exerciseId: string; issuedAt: string; done: Record<string, boolean> }

export interface Scenario { id: string; name: string; savedAt: string; overrides: Partial<Config['funnel']> & { note?: string }; p50?: number; pHit?: number }

export interface WeeklyReview { weekKey: string; wins: string; misses: string; decisions: string; submittedAt?: string }

export interface KycNote { id: string; date: string; text: string }

export interface Discovery {
  answers: Record<string, string>
  confirmed: boolean
  confirmedAt?: string
}

// ---- Launch readiness (M0) ----

export type GateStatus = 'not_started' | 'in_progress' | 'passed' | 'failed' | 'waived'
export interface GateState { status: GateStatus; evidence: string; verifiedBy: string; updatedAt: string }
export interface StepState { done: boolean; doneAt?: string; note?: string; owner?: string }
export interface Readiness {
  gates: Record<string, GateState>
  steps: Record<string, StepState>
  tripwireBaseline: Record<string, string>
}

export interface AppData {
  reps: Rep[]
  daily: Record<string, DailyLog>
  candidates: Candidate[]
  trainees: Trainee[]
  families: Family[]
  clients: ClientCompliance[]
  signals: SignalBatch[]
  creatives: Creative[]
  channelHealth: ChannelHealth[]
  tickets: Ticket[]
  grievances: Grievance[]
  refunds: Refund[]
  agents: Record<string, AgentState>
  tasks: TaskItem[]
  exerciseLog: Record<string, ExerciseLogEntry>   // date → entry
  scenarios: Scenario[]
  wbr: Record<string, WeeklyReview>
  discovery: Discovery
  readiness: Readiness
  /** Latest imported live-data snapshot (see model/feed.ts). */
  feed?: import('./feed').FeedSnapshot
  /** Ideas and initiatives being discussed, per department. */
  initiatives: import('./org').Initiative[]
  /** The meetings the business is actually run in. */
  meetings: import('./org').Meeting[]
  auditTrail: { at: string; what: string }[]
}
