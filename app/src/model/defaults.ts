// CEO defaults — every figure from the OPERATOR brief, restorable at any time.
import type { AppData, Config } from './types'

export const CEO_DEFAULT_CONFIG: Config = {
  entity: {
    legalName: '5 CIRCLES PRIVATE LIMITED',
    brand: '5 Circles',
    sebiReg: 'INH000020004',
    cin: '',                                  // confirm with CS — Discovery Q1
    registeredOffice: 'Mumbai, Maharashtra',
    corporateOffice: 'Kanpur, Uttar Pradesh',
    complianceOfficer: '',                    // Discovery Q2
    principalOfficer: '',                     // Discovery Q3
    regType: 'unconfirmed',
  },
  // T-15 → T-0 readiness runway, then the sprint. Day 1 moved from 11 Aug to 26 Aug
  // to buy the 15-day preparation window (see docs/PRELAUNCH.md).
  prep: { startDate: '2026-08-11', endDate: '2026-08-25' },
  sprint: { startDate: '2026-08-26', days: 60 },
  target: {
    monthlyRunRate: 2500000,
    basis: 'gross',
    gstRate: 0.18,
    workingDaysPerMonth: 26,
    // Planned monthly run-rate at each sprint week — the pacing spine.
    // W1 ≈ today's base; Day-60 exit = ₹25L/mo. Integrates to ≈ ₹29L cumulative,
    // with Month-1 ≈ ₹9–10L, matching Appendix C of the plan.
    runRatePlanWeekly: [500000, 700000, 900000, 1100000, 1350000, 1600000, 1900000, 2200000, 2500000],
  },
  funnel: {
    connectRate: 0.55,
    qualRate: 0.45,
    closeRate: 0.14,
    cplBlended: 65,
    paidLeadShare: 0.70,
    speedToLeadTargetMin: 5,
    bumpTakeRate: 0.25,
  },
  products: [
    { id: 'p1', name: 'Market Foundation Course', short: 'P1 Course', priceInclGst: 1999, unitsPlanMonthly: 380, desk: 'A', regClass: 'education', countsTowardCap: false, termMonths: 0, note: 'Single-call phone close, no webinar' },
    { id: 'p1b', name: 'Sector Playbook Pack (order bump)', short: 'P1b Bump', priceInclGst: 499, unitsPlanMonthly: 95, desk: 'A', regClass: 'education', countsTowardCap: false, termMonths: 0 },
    { id: 'p2a', name: 'Scanner Lite — monthly', short: 'Lite /mo', priceInclGst: 499, unitsPlanMonthly: 180, desk: 'A', regClass: 'saas', countsTowardCap: false, termMonths: 1, note: 'User-defined conditions only. No recommendations.' },
    { id: 'p2b', name: 'Scanner Lite — annual', short: 'Lite /yr', priceInclGst: 4999, unitsPlanMonthly: 70, desk: 'A', regClass: 'saas', countsTowardCap: false, termMonths: 12 },
    { id: 'p2c', name: 'Scanner Pro — signal engine', short: 'Pro /yr', priceInclGst: 14999, unitsPlanMonthly: 20, desk: 'B', regClass: 'research', countsTowardCap: true, termMonths: 12, note: 'RA service. KYC + agreement + risk profile before access; analyst sign-off on every batch.' },
    { id: 'p3', name: 'Research Subscription', short: 'Research', priceInclGst: 24999, unitsPlanMonthly: 20, desk: 'B', regClass: 'research', countsTowardCap: true, termMonths: 12, note: 'Positional calls with written rationale. Full RA compliance.' },
    { id: 'p4a', name: 'City Workshop (one day)', short: 'Workshop', priceInclGst: 9999, unitsPlanMonthly: 25, desk: 'B', regClass: 'education', countsTowardCap: false, termMonths: 0 },
    { id: 'p4b', name: 'Mentorship Cohort (12 weeks)', short: 'Mentorship', priceInclGst: 74999, unitsPlanMonthly: 3, desk: 'B', regClass: 'education', countsTowardCap: false, termMonths: 3, note: 'Invite-only, existing buyers only, senior closers' },
  ],
  desks: {
    A: { dialsPerDayRamped: 100, dialsPerDayM1: 70, p1PerDayRamped: 3.2, p1PerDayM1: 1.4 },
    B: { dialsPerDayRamped: 60, p3PerMonth: 9, p4aPerMonth: 13, revenuePerMonth: 350000 },
  },
  ramp: { curveByWeek: [45, 45, 70, 70, 90, 90, 100] },
  comp: {
    deskAFixed: 18000, deskAPerP1: 250, deskAPerScannerAnnual: 400,
    deskBFixed: 28000, deskBPctP3P4: 0.04,
    clawbackDays: 30,
  },
  headcountPlan: [
    { fn: 'sales', role: 'Desk A closers', planned: 11 },
    { fn: 'sales', role: 'Desk B closers', planned: 4 },
    { fn: 'sales', role: 'Pre-sales qualifiers', planned: 2 },
    { fn: 'sales', role: 'Team Leads', planned: 2 },
    { fn: 'sales', role: 'Sales Head', planned: 1 },
    { fn: 'sales', role: 'Trainer + Call QA', planned: 1 },
    { fn: 'marketing', role: 'Performance marketer', planned: 1 },
    { fn: 'marketing', role: 'Video editor / creative', planned: 1 },
    { fn: 'marketing', role: 'Content & social', planned: 1 },
    { fn: 'marketing', role: 'Copywriter', planned: 1 },
    { fn: 'research', role: 'SEBI-qualified analysts', planned: 2 },
    { fn: 'compliance', role: 'Compliance Officer', planned: 1 },
    { fn: 'operations', role: 'Onboarding + KYC', planned: 1 },
    { fn: 'operations', role: 'Support', planned: 1 },
    { fn: 'technology', role: 'Product / tool engineers', planned: 2 },
    { fn: 'finance', role: 'Accounts', planned: 1 },
    { fn: 'hr', role: 'Recruiter + HR generalist', planned: 1 },
  ],
  channels: [
    { id: 'meta', name: 'Meta (FB + IG)', spendPlanMonthly: 240000, cplTarget: 60, paid: true },
    { id: 'google', name: 'Google + YouTube', spendPlanMonthly: 165000, cplTarget: 85, paid: true },
    { id: 'vernacular', name: 'Vernacular (ShareChat/Josh/Moj)', spendPlanMonthly: 60000, cplTarget: 45, paid: true },
    { id: 'native', name: 'Native (Taboola/Outbrain)', spendPlanMonthly: 50000, cplTarget: 75, paid: true },
    { id: 'affiliate', name: 'Verified affiliates', spendPlanMonthly: 35000, cplTarget: 65, paid: true },
    { id: 'organic', name: 'Organic (YT/IG/Telegram/SEO/referral)', spendPlanMonthly: 0, cplTarget: 0, paid: false },
  ],
  spendRampMonthly: [
    { uptoWeek: 3, monthly: 200000 },
    { uptoWeek: 6, monthly: 350000 },
    { uptoWeek: 99, monthly: 500000 },
  ],
  opex: [
    { name: 'Payroll (incl. incentives)', monthly: 904000 },
    { name: 'Marketing / ad spend', monthly: 550000 },
    { name: 'Technology stack', monthly: 120000 },
    { name: 'Offices (Mumbai + Kanpur)', monthly: 150000 },
    { name: 'Payment gateway ~2.2%', monthly: 55000 },
    { name: 'Compliance, legal, audit, RAASB', monthly: 75000 },
    { name: 'Content production', monthly: 80000 },
    { name: 'Contingency', monthly: 70000 },
  ],
  cash: { openingCash: 1000000, workingCapitalAvailable: 1800000, runwayAlertDays: 45 },
  feeCap: { capPerFamilyYear: 151000, advanceMaxMonths: 12 },
  mc: {
    runs: 8000,
    sdClose: 0.16, sdCpl: 0.20, sdRamp: 0.15, sdAov: 0.08,
    organicLeadsMonthly: 3285,
  },
}

export const DEFAULT_DATA: AppData = {
  reps: [
    { id: 'rep_01', name: 'Closer 1 (existing)', desk: 'A', joinDate: '2026-06-01', active: true },
    { id: 'rep_02', name: 'Closer 2 (existing)', desk: 'A', joinDate: '2026-06-01', active: true },
    { id: 'rep_03', name: 'Closer 3 (existing)', desk: 'A', joinDate: '2026-06-01', active: true },
    { id: 'rep_04', name: 'Sr Closer 1 → Desk B', desk: 'B', joinDate: '2026-06-01', active: true },
    { id: 'rep_05', name: 'Sr Closer 2 → Desk B', desk: 'B', joinDate: '2026-06-01', active: true },
    // Planned cohorts. The prep window exists so Cohort 1 is hired, offered and
    // Academy-ready BEFORE Day 1 — they join on Day 1, not in week 3.
    { id: 'rep_c1a', name: 'Cohort 1 — A1 (planned)', desk: 'A', joinDate: '2026-08-26', active: true, planned: true },
    { id: 'rep_c1b', name: 'Cohort 1 — A2 (planned)', desk: 'A', joinDate: '2026-08-26', active: true, planned: true },
    { id: 'rep_c1c', name: 'Cohort 1 — A3 (planned)', desk: 'A', joinDate: '2026-08-26', active: true, planned: true },
    { id: 'rep_c1d', name: 'Cohort 1 — A4 (planned)', desk: 'A', joinDate: '2026-08-26', active: true, planned: true },
    { id: 'rep_c1e', name: 'Cohort 1 — A5 (planned)', desk: 'A', joinDate: '2026-08-26', active: true, planned: true },
    { id: 'rep_b1', name: 'Senior hire — B1 (planned)', desk: 'B', joinDate: '2026-09-01', active: true, planned: true },
    { id: 'rep_b2', name: 'Senior hire — B2 (planned)', desk: 'B', joinDate: '2026-09-01', active: true, planned: true },
    { id: 'rep_c2a', name: 'Cohort 2 — A1 (planned)', desk: 'A', joinDate: '2026-09-09', active: true, planned: true },
    { id: 'rep_c2b', name: 'Cohort 2 — A2 (planned)', desk: 'A', joinDate: '2026-09-09', active: true, planned: true },
    { id: 'rep_c2c', name: 'Cohort 2 — A3 (planned)', desk: 'A', joinDate: '2026-09-09', active: true, planned: true },
    { id: 'rep_c3a', name: 'Cohort 3 — A1 (planned)', desk: 'A', joinDate: '2026-09-23', active: true, planned: true },
    { id: 'rep_c3b', name: 'Cohort 3 — A2 (planned)', desk: 'A', joinDate: '2026-09-23', active: true, planned: true },
    { id: 'rep_c3c', name: 'Cohort 3 — A3 (planned)', desk: 'A', joinDate: '2026-09-23', active: true, planned: true },
  ],
  daily: {},
  candidates: [],
  trainees: [],
  families: [],
  clients: [],
  signals: [],
  creatives: [],
  channelHealth: [
    { channelId: 'meta', accountStatus: 'in_review', verificationDone: false, siPortalMatched: false, disapprovalPct: 0, appealOpen: false, lastChecked: '2026-08-10', note: 'SEBI advertiser verification to submit Day 1' },
    { channelId: 'google', accountStatus: 'in_review', verificationDone: false, siPortalMatched: false, disapprovalPct: 0, appealOpen: false, lastChecked: '2026-08-10', note: 'India financial-services verification to submit Day 1' },
  ],
  tickets: [],
  grievances: [],
  refunds: [],
  agents: {},
  tasks: [],
  exerciseLog: {},
  scenarios: [],
  wbr: {},
  discovery: { answers: {}, confirmed: false },
  readiness: { gates: {}, steps: {}, tripwireBaseline: {} },
  initiatives: [
    { id: 'ini_01', title: 'Open the research line (Scanner Pro + Research Subscription)', dept: 'research', stage: 'evaluating', impactInrMonthly: 800000, effortDays: 30, owner: 'Harsh + Founder', decisionFrom: 'founder', rationale: 'Roughly a third of the ₹25L plan. Blocked on a named analyst, a named Compliance Officer, back-test evidence and the algo-framework answer — none of which compress into the runway.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
    { id: 'ini_02', title: 'Scanner Lite as a Desk A attach on the P1 call', dept: 'product', stage: 'building', impactInrMonthly: 440000, effortDays: 10, owner: 'Contract engineer + Harsh', decisionFrom: 'owner', rationale: 'End-of-day screener on user-defined conditions only. Clean education classification, zero onboarding friction, closes on the same call as the course.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
    { id: 'ini_03', title: 'Work the 179 live leads sitting untouched', dept: 'sales', stage: 'approved', impactInrMonthly: 120000, effortDays: 3, owner: 'Sales Head', decisionFrom: 'owner', rationale: 'Already paid for at ₹7.10 each. July generated 260+ leads and worked none of them; this is the same failure forming again.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
    { id: 'ini_04', title: 'Move the NIFTY Instagram boost to a lead-form objective', dept: 'marketing', stage: 'idea', impactInrMonthly: 60000, effortDays: 1, owner: 'Media buyer', decisionFrom: 'head', rationale: '₹533 spent on LINK_CLICKS produces clicks no closer can work. Same creative, lead objective, measurable CPL.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
    { id: 'ini_05', title: 'City workshops beyond Kanpur (Lucknow, Varanasi)', dept: 'operations', stage: 'parked', impactInrMonthly: 250000, effortDays: 20, owner: 'Ops lead', decisionFrom: 'founder', rationale: 'Venue contracting, travel and founder calendar unsolved. A cancelled workshop with paid seats is a refund, reputation and gateway-dispute event at once. Decide at Day 30 on real demand.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
    { id: 'ini_06', title: 'Gateway payments pushed into the dashboard via Make', dept: 'finance', stage: 'idea', impactInrMonthly: 0, effortDays: 3, owner: 'Abhishek', decisionFrom: 'owner', rationale: 'Collections are the last big manual number. Wiring payment.captured removes the nightly typing that kills adoption.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
    { id: 'ini_07', title: 'Second face trained so the funnel is not one person', dept: 'hr', stage: 'idea', impactInrMonthly: 0, effortDays: 25, owner: 'Founder', decisionFrom: 'founder', rationale: 'Rahul is the face, the teacher, the closer and the war-room chair. A week of illness stops the company. Train a second host by week 5.', createdAt: '2026-08-10', movedAt: '2026-08-10' },
  ],
  meetings: [],
  auditTrail: [],
}

export const FN_LABEL: Record<string, string> = {
  sales: 'Sales', marketing: 'Marketing', hr: 'HR', operations: 'Operations',
  finance: 'Finance', compliance: 'Compliance', research: 'Research', management: 'Management', technology: 'Technology',
}
