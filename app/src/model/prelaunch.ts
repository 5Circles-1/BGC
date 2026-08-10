// The T-15 → T-0 launch readiness runway. Content is the plan of record;
// per-item state (done / gate status / evidence) lives in AppData.readiness.
// Narrative version: docs/PRELAUNCH.md · Back-test protocol: docs/PRODUCT-READINESS.md
//
// Calendar: T-15 = Tue 11 Aug 2026 … T-1 = Tue 25 Aug (final prep day, go/no-go
// board 18:00) … T-0 = Wed 26 Aug = SPRINT DAY 1. Sat 15 Aug is Independence Day
// (banks/registrar shut — internal work only); Sun 16 and Sun 23 Aug are catch-up.

export type DomainKey = 'compliance' | 'product' | 'sales' | 'marketing' | 'tech' | 'hr' | 'finance' | 'offline'

export const DOMAIN_LABEL: Record<DomainKey, string> = {
  compliance: 'Compliance',
  product: 'Product & backtest',
  sales: 'Sales floor',
  marketing: 'Marketing & ads',
  tech: 'Tech & tools',
  hr: 'HR & hiring',
  finance: 'Finance & cash',
  offline: 'Offline ringfence',
}

export interface PrepStep {
  id: string; day: string; date: string; domain: DomainKey
  action: string; owner: string; output: string; hours: number; dependsOn?: string
}
export interface PrepGate {
  id: string; name: string; domain: DomainKey
  passTest: string; verifier: string; blocksLaunch: boolean; dueDay: string
}
export interface PrepRole {
  role: string; person: string; domain: DomainKey
  mandate: string; ownsNumbers: string[]; stopsDoing: string; deliverables: string[]
}
export interface PrepTool {
  tool: string; purpose: string; domain: DomainKey; owner: string
  costInrMonthly: number | null; leadTime: string; failureMode: string
}
export interface Tripwire { metric: string; threshold: string; action: string; owner: string }

export const DAY_DATE: Record<string, string> = {
  'T-15': 'Tue 11 Aug', 'T-14': 'Wed 12 Aug', 'T-13': 'Thu 13 Aug', 'T-12': 'Fri 14 Aug',
  'T-11': 'Sat 15 Aug', 'T-10': 'Sun 16 Aug', 'T-9': 'Mon 17 Aug', 'T-8': 'Tue 18 Aug',
  'T-7': 'Wed 19 Aug', 'T-6': 'Thu 20 Aug', 'T-5': 'Fri 21 Aug', 'T-4': 'Sat 22 Aug',
  'T-3': 'Sun 23 Aug', 'T-2': 'Mon 24 Aug', 'T-1': 'Tue 25 Aug', 'T-0': 'Wed 26 Aug — DAY 1',
}

// ---------------------------------------------------------------- GATES

export const PREP_GATES: PrepGate[] = [
  // Compliance — all blocking
  { id: 'G-A', name: 'Registration & officers of record', domain: 'compliance', blocksLaunch: true, dueDay: 'T-13',
    verifier: 'Retained RA-compliance counsel; Sanya reads Config values back against the certificate',
    passTest: 'Folder 01-Registration holds: the SEBI RA certificate for INH000020004 showing current status and individual/non-individual; board resolutions appointing Principal Officer and Compliance Officer with countersigned written acceptances; counsel\'s written eligibility opinion on both. OPERATOR Config entity fields (cin, complianceOfficer, principalOfficer, regType) match the documents exactly.' },
  { id: 'G-B', name: 'Advertisement Code & brand separation', domain: 'compliance', blocksLaunch: true, dueDay: 'T-4',
    verifier: 'Compliance Officer; Sanya re-runs the crossing test blind',
    passTest: '10 randomly drawn live-candidate creatives (5 education, 5 research) each pass all nine M6 pre-flight rules with a real approver name and timestamp in the M9 register. Both landing pages carry the identity block, accuracy declaration and ≥10pt risk warning. An outsider handed both brands cannot find a path from an education asset to a research service.' },
  { id: 'G-C', name: '[Research-open gate] Client onboarding chain & fee-cap gate', domain: 'compliance', blocksLaunch: false, dueDay: 'T-4',
    verifier: 'Retained counsel reviewing the screen recording — not the person who ran the dry run',
    passTest: 'A dummy client goes end to end on video: agreement + MITC e-signed with audit trail, KYC filed, risk profile scored. M9 provisioning REFUSES with one gate off and ALLOWS with all three on. The payment-link gate blocks an over-cap charge and allows an under-cap one, both demonstrated.' },
  { id: 'G-D', name: '[Research-open gate] Analyst sign-off & AI chain', domain: 'compliance', blocksLaunch: false, dueDay: 'T-5',
    verifier: 'Compliance Officer — or counsel, if the CO is also the signing analyst. The signer never verifies their own chain.',
    passTest: 'A named analyst whose eligibility counsel has confirmed in writing is recorded in Config and M9. A test batch moves queued → approved (name + timestamp) → released, and release is demonstrably refused while unapproved. All 31 M13 agents have a named human gatekeeper.' },
  { id: 'G-E', name: 'Recording, records & grievance machinery', domain: 'compliance', blocksLaunch: true, dueDay: 'T-5',
    verifier: 'Compliance Officer signs; Abhishek runs retrieval, Sanya runs restore — three people, none built all three',
    passTest: 'Three live test calls (Hindi, English, research pitch) each carry the disclosure and are retrievable within five minutes by rep and date. Retention is set to the CO-confirmed minimum. Grievance alias is live with the escalation matrix published on both brands. An M9 CSV export restores into a clean browser.' },
  { id: 'G-F', name: '[Research-open gate] Segregated books & money rails', domain: 'compliance', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Company CA (external) plus the Compliance Officer',
    passTest: 'Two invoice series exist; a ₹1 test transaction on each rail produces an invoice in the correct series settling to the correct named account. Two profit centres with a signed cost-allocation key. The fee-cap ledger counts only RA-series ex-GST amounts.' },

  // Product
  { id: 'G-P1', name: 'P1 course is deliverable exactly as sold', domain: 'product', blocksLaunch: true, dueDay: 'T-2',
    verifier: 'Sanya + a senior floor counsellor (neither built any part of it)',
    passTest: 'Two independent real-money purchases complete on a ₹9,000-class Android over 4G: payment succeeds, GST invoice issues on the correct series, Rigi access granted within 15 minutes, doubt group joined, Module 1 plays at 720p without buffering, comprehension quiz submits. The dated release calendar for Modules 4–8 appears on the sales page and in the Module-1 welcome.' },
  { id: 'G-LIST', name: 'Day-1 price list contains only gate-passed SKUs', domain: 'product', blocksLaunch: true, dueDay: 'T-2',
    verifier: 'Compliance Officer + Finance owner',
    passTest: 'Every SKU on the Day-1 price list maps to a passed acceptance gate with recorded evidence. P2c, P3 and P4b are absent from the list, every script and every page, and no payment link can be generated for them. OPERATOR Config reflects the same list with zeroed month-1 units for deferred SKUs.' },
  { id: 'G-SEG', name: 'Product surfaces keep education and research separate', domain: 'product', blocksLaunch: true, dueDay: 'T-4',
    verifier: 'Compliance Officer',
    passTest: 'Anything research-classed sits on a separate domain, login and set of books. No education asset links to, mentions or implies a research service. P1 and Scanner Lite pages contain no recommendation language.' },
  { id: 'G-LITE', name: 'Scanner Lite is a tool, and is sellable', domain: 'product', blocksLaunch: false, dueDay: 'T-5',
    verifier: 'Rahul Saraoge + Compliance Officer',
    passTest: 'Someone who did not build it composes a screen from ≥10 primitives, saves it, and receives the correct alert next session. A raw API dump contains ZERO keys named action, entry, stoploss, target or any view-bearing score — verified in the payload, not the UI.' },
  { id: 'G-P1B', name: 'Sector Playbook Pack ships with no recommendation', domain: 'product', blocksLaunch: false, dueDay: 'T-4',
    verifier: 'Compliance Officer + Sanya',
    passTest: '≥4 sector playbooks delivered as PDFs. Dated CO confirmation that the pack contains no securities recommendation. The +₹499 bump appears at checkout and takes payment.' },
  { id: 'G-P0', name: 'P0 seven-day drip is live and compliant', domain: 'product', blocksLaunch: false, dueDay: 'T-5',
    verifier: 'Sales Head + marketing owner',
    passTest: 'Three test numbers receive all seven messages on schedule. All seven assets carry an M6 pre-flight approval record. The Day-7 CTA creates a lead row routed to Desk A.' },
  { id: 'G-P4A', name: 'City Workshop is a dated, deliverable product', domain: 'product', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Sanya + Compliance Officer',
    passTest: 'A dated Kanpur workshop exists: named date, own classroom, 40-seat cap, published 6.5-hour curriculum, published education refund terms. One live test booking takes payment and issues a seat confirmation.' },
  { id: 'G-BT', name: 'Back-test integrity discipline in place before any out-of-sample access', domain: 'product', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Rahul Saraoge witnesses pre-registration; re-verified by the registered analyst once appointed',
    passTest: 'The protocol document exists, is dated, and publishes numeric launch thresholds. The N-trials research log lists every variant tried with date and result. The final rule is pre-registered with a file hash, witnessed, BEFORE any out-of-sample access. The universe is point-in-time and retains delisted names.' },
  { id: 'G-PRO', name: 'Scanner Pro / Research Subscription sellable — EXPECTED TO FAIL, DELIBERATELY', domain: 'product', blocksLaunch: false, dueDay: 'T-1',
    verifier: 'Compliance Officer + Rahul Saraoge',
    passTest: 'ALL of: a named SEBI-qualified registered analyst on record; a named CO with written classification confirmation; a back-test pack meeting every published threshold (≥100 closed out-of-sample trades across ≥30 instruments over ≥18 months, positive net expectancy after costs); ≥30 sessions of unedited forward paper log; the algo-framework question answered in writing. Recorded as FAILED at T-1 with evidence, so nobody later believes the SKU was overlooked rather than consciously withheld.' },

  // Sales
  { id: 'G-S1', name: 'The pitch exists, is compliant, and is on tape', domain: 'sales', blocksLaunch: true, dueDay: 'T-6',
    verifier: 'Compliance Officer (language) + Rahul (commercial)',
    passTest: 'The P1 single-call script is written line by line, recorded by the best closer as the reference call, and passes the never-say list with zero findings. The objection bank holds ≥20 real objections harvested from live July-lead calls, each with a compliant rebuttal.' },
  { id: 'G-S2', name: 'Academy content exists for Days 1–5 at minimum', domain: 'sales', blocksLaunch: true, dueDay: 'T-3',
    verifier: 'Trainer + Compliance Officer for the Day-2 module',
    passTest: 'Decks, quiz banks and role-play scenarios exist for Academy Days 1–5. The Day-2 SEBI compliance quiz has ≥40 items with a ≥95% pass mark, written or approved by the CO. Days 6–10 material is drafted and dated for completion inside sprint week 1.' },
  { id: 'G-S3', name: 'Speed-to-lead under five minutes, proven in a timed drill', domain: 'sales', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Sales Head times it; Abhishek supplies the router timestamps',
    passTest: '20 synthetic leads dropped across the working day produce a median first-dial time under 5 minutes and a 90th percentile under 12, measured from router timestamps, not memory.' },
  { id: 'G-S4', name: 'Desk B has a named book before it has a target', domain: 'sales', blocksLaunch: false, dueDay: 'T-4',
    verifier: 'Rahul + Sales Head',
    passTest: 'The past-student and alumni base is segmented into a worked list with contactability marked. The two Desk B promotions are named, briefed and have signed comp letters. Desk B\'s Day-1 book is P4a workshops and Scanner Lite annual — not research.' },

  // Marketing
  { id: 'G-M1', name: 'At least one paid channel is verified and spendable', domain: 'marketing', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Media buyer + Rahul',
    passTest: 'The education-brand ad account has a payment method, a linked Page, completed business verification and platform financial-services verification, and has spent ≥₹1,000 on a live test ad without disapproval. If not passed, the documented organic-and-warm-base fallback is activated instead — launch is not delayed for it.' },
  { id: 'G-M2', name: 'Tracking tells the truth', domain: 'marketing', blocksLaunch: false, dueDay: 'T-3',
    verifier: 'Abhishek verifies events; Sales Head confirms leads arrive with intent fields',
    passTest: 'Pixel and Conversions API fire Lead, InitiateCheckout and Purchase, verified in test events. Every lead lands with campaign/adset/ad/form and the pre-qualification answers attached, so CPL traces to creative and close rate traces to angle.' },
  { id: 'G-M3', name: 'A creative bank exists, all of it approved', domain: 'marketing', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Compliance Officer',
    passTest: '≥12 education creatives live-ready in the M6 library, each with an approver name and timestamp. Research-brand creatives are held separately and unpublished until G-PRO passes.' },

  // Tech
  { id: 'G-T1', name: 'The floor can dial, and every call is recorded', domain: 'tech', blocksLaunch: true, dueDay: 'T-4',
    verifier: 'Abhishek builds; Sales Head accepts on a live call',
    passTest: 'Cloud telephony is live for the Day-1 seat count with automatic recording and a pre-call disclosure in Hindi and English. A test call is placed, recorded, retrieved and played back. Capacity is confirmed for the planned dial volume.' },
  { id: 'G-T2', name: 'Lead-to-dial plumbing works end to end', domain: 'tech', blocksLaunch: true, dueDay: 'T-3',
    verifier: 'Sales Head, on live test leads he submits himself',
    passTest: 'A lead submitted on the real form appears in the CRM, acknowledges by WhatsApp, and pings the on-duty closer — all inside the SLA. Make.com is on a paid plan with headroom for planned volume. Every human retyping point is either automated or logged as an accepted risk.' },
  { id: 'G-T3', name: 'Payment to access is automatic and gated', domain: 'tech', blocksLaunch: true, dueDay: 'T-2',
    verifier: 'Sanya (finance side) + Abhishek (technical side)',
    passTest: 'A real payment triggers an invoice, a Collections row and course provisioning within 15 minutes for education SKUs. Research SKUs cannot be provisioned at all while any KYC gate is open.' },
  { id: 'G-T4', name: 'OPERATOR is seeded, honest and backed up', domain: 'tech', blocksLaunch: false, dueDay: 'T-1',
    verifier: 'Rahul reads the dashboard cold and finds no placeholder',
    passTest: 'Config carries real entity, roster, prices, channels and cash values with no CEO defaults left where a real number exists. Discovery is answered and confirmed. A JSON backup exports and restores into a clean browser. The nightly backup owner is named.' },

  // HR
  { id: 'G-H1', name: 'Cohort 1 is signed, not hoped for', domain: 'hr', blocksLaunch: false, dueDay: 'T-5',
    verifier: 'Rahul countersigns; Sanya holds the signed originals',
    passTest: '≥6 signed offer letters with a join date of 26 Aug, each with comp, incentive and the 30-day clawback explained in writing and initialled. A warm backup bench of ≥3 exists, because 20% do not show.' },
  { id: 'G-H2', name: 'The floor physically exists', domain: 'hr', blocksLaunch: false, dueDay: 'T-3',
    verifier: 'Ops lead load-tests it; Sales Head accepts',
    passTest: 'Desks, chairs, headsets and devices for the Day-1 seat count are in the room and working. Internet and power are load-tested with every seat live simultaneously for one hour. Seating does not displace classroom or counsellor space.' },
  { id: 'G-H3', name: 'The back office has hands', domain: 'hr', blocksLaunch: false, dueDay: 'T-8',
    verifier: 'Rahul',
    passTest: 'The Compliance & Documentation Executive is engaged and working, and recruitment support is contracted. Sanya\'s prep load is demonstrably under 6 hours a week after reallocation — verified by walking her assigned steps in M0, not by asking her if she is coping.' },

  // Finance
  { id: 'G-F1', name: 'One price book, and no way to bill around it', domain: 'finance', blocksLaunch: true, dueDay: 'T-2',
    verifier: 'Rahul signs the book; the CA confirms the invoice mapping',
    passTest: 'The signed price book covers only gate-passed SKUs. Gateway links exist for exactly those SKUs and no others. No individual can create an ad-hoc link; research-series links are restricted to the Compliance Executive\'s account.' },
  { id: 'G-F2', name: 'Working capital and the kill switch are in writing', domain: 'finance', blocksLaunch: true, dueDay: 'T-6',
    verifier: 'Rahul + directors, minuted',
    passTest: 'The deployable working-capital figure is confirmed with tranche release triggers and, critically, the pre-agreed cash conditions under which spend freezes or the sprint slows — signed before Day 1, so it is never an emotional decision at Day 40.' },
  { id: 'G-F3', name: 'The registers are current and the cash paths are separate', domain: 'finance', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Company CA',
    passTest: 'Accounts Manual registers are populated to current. The offline cash path (counter, weekly banking, ₹25k float, s.269ST discipline) and the online gateway-only path are documented as separate flows with named custodians.' },

  // Offline
  { id: 'G-O1', name: 'Offline baselines are measured before anything changes', domain: 'offline', blocksLaunch: true, dueDay: 'T-9',
    verifier: 'Ops lead records; Rahul countersigns',
    passTest: 'Batch fill %, walk-in enquiry-to-response time, current monthly fee income, student NPS and faculty teaching load are each measured and recorded in M0. A tripwire with no baseline cannot trip.' },
  { id: 'G-O2', name: 'The ringfence is named, not implied', domain: 'offline', blocksLaunch: true, dueDay: 'T-6',
    verifier: 'Rahul signs; every named person is told directly',
    passTest: 'A signed roster names the people who may NOT be pulled onto sprint work, and the founder calendar blocks protecting batch teaching are in the shared calendar as immovable. Every person on the list has been told in person.' },
  { id: 'G-O3', name: 'The cannibalisation answer is written into the scripts', domain: 'offline', blocksLaunch: true, dueDay: 'T-6',
    verifier: 'Rahul + Sales Head + senior counsellor',
    passTest: 'The written rule distinguishing P1 (₹1,999 recorded, national, self-serve) from TDP (₹15,000 live classroom, Kanpur, mentored) exists, is in the Academy Day-1 module and in the counsellor briefing, and the routing rule for Kanpur-area walk-in-intent leads is live in the CRM. No closer can discount TDP to match P1.' },
  { id: 'G-O4', name: 'Tripwires and pull-back actions are pre-agreed', domain: 'offline', blocksLaunch: false, dueDay: 'T-2',
    verifier: 'Rahul + Ops lead',
    passTest: 'Every tripwire has a threshold and a named automatic pull-back action, agreed and minuted before Day 1, reviewed every Monday in the WBR alongside the sprint numbers.' },
]

// ---------------------------------------------------------------- STEPS

const S = (id: string, day: string, domain: DomainKey, owner: string, hours: number, action: string, output: string, dependsOn?: string): PrepStep =>
  ({ id, day, date: DAY_DATE[day], domain, owner, hours, action, output, dependsOn })

export const PREP_STEPS: PrepStep[] = [
  // ============ T-15 Tue 11 Aug ============
  S('c01', 'T-15', 'compliance', 'Rahul Saraoge', 3, 'Pull the complete SEBI RA registration file for INH000020004 from whoever filed it (CS / consultant / RAASB login): certificate, application, named officers, named analysts, validity.', 'Registration file in Shared Drive 01-Registration'),
  S('c02', 'T-15', 'compliance', 'Rahul Saraoge', 2, 'Engage retained RA-compliance counsel (practising CS or SEBI-RA compliance firm). Two quotes, pick the same day. Scope: agreement + MITC, eligibility opinions, four written questions, T-1 gate verification.', 'Signed engagement letter'),
  S('c03', 'T-15', 'compliance', 'Sanya', 2, 'Assemble the entity pack: Certificate of Incorporation, CIN, PAN, GST certificate and filing status, registered-office proof.', 'Entity pack filed; CIN into Config'),
  S('c04', 'T-15', 'tech', 'Abhishek', 2, 'Create Google Shared Drive 5C-COMPLIANCE (a Shared Drive, never a personal My Drive — files must survive an employee exit) with the nine numbered folders.', 'Shared Drive live with folder scheme'),
  S('p01', 'T-15', 'product', 'Rahul Saraoge', 1.5, 'Rahul + Harsh answer Discovery Q8/Q9 in writing: are today\'s tool signals analyst-generated or automatic, is any analyst name attached, does anything touch broker execution, and what is genuinely sellable today.', 'Written answers pasted into OPERATOR Discovery'),
  S('p02', 'T-15', 'product', 'Rahul Saraoge', 1, 'Lock and sign the Day-1 sellable set: SHIP P0, P1 (dated release calendar), P1b, P4a Kanpur. CONDITIONAL Scanner Lite. DEFER Scanner Pro, Research Subscription, Mentorship.', 'Signed Day-1 sellable set'),
  S('p03', 'T-15', 'product', 'Harsh', 3, 'Open the market-data vendor process with two vendors in parallel: EOD split/bonus-adjusted OHLCV, corporate actions, POINT-IN-TIME index constituents, retained delisted names. Longest lead item in the domain.', 'Two vendor quotes + licence paperwork started'),
  S('p04', 'T-15', 'product', 'Harsh', 2.5, 'Write the contract product-engineer brief and its acceptance test (Scanner Lite MSV: EOD only, Nifty 500 + F&O universe, ≥10 primitives, ≤5 AND-combined conditions, 3 saved screens).', 'Engineer brief + acceptance test'),
  S('h01', 'T-15', 'hr', 'Sanya', 2, 'Post the Desk A closer JD and the Compliance & Documentation Executive JD on Apna, WorkIndia and local groups; announce the ₹2,000 staff referral bonus. Source at 6× — 6 seats needs ~36 candidates.', 'Live postings; referral announced'),
  S('h02', 'T-15', 'hr', 'Rahul Saraoge', 1, 'Contract recruitment support for the hiring sprint. Sanya cannot run a 36-candidate pipeline alongside payroll, registers and banking; this is the decision that unblocks her.', 'Recruiter engaged'),
  S('m01', 'T-15', 'marketing', 'Rahul Saraoge', 2, 'Register the firm\'s contact details on the SEBI SI Portal using the EXACT email and mobile that will be used on Meta and Google. A mismatch here is the most common cause of rejection.', 'SI Portal registration submitted'),
  S('m02', 'T-15', 'marketing', 'Yash', 3, 'Fix the education ad account 5793…8211: add the company payment method, link the Facebook Page and Instagram, start business verification. Submit platform financial-services verification for the education brand.', 'Verification submitted; account spendable-pending'),
  S('m03', 'T-15', 'marketing', 'Yash', 2, 'Start WhatsApp Business API provisioning with DLT registration and template approval — multi-day external lead time, so it starts on day one or it does not land.', 'WABA application submitted'),
  S('t01', 'T-15', 'tech', 'Abhishek', 2, 'Upgrade Make.com off the Free plan (1,000 ops/month and 2 scenarios dies within days at planned volume) and begin cloud-telephony vendor selection for the Day-1 seat count.', 'Make on paid plan; 2 telephony quotes'),
  S('o01', 'T-15', 'offline', 'Ops lead', 2, 'Begin measuring the offline baselines that every tripwire depends on: batch fill %, walk-in response time, monthly fee income, student NPS, faculty load.', 'Baseline measurement started'),

  // ============ T-14 Wed 12 Aug ============
  S('c05', 'T-14', 'compliance', 'Rahul Saraoge', 2.5, 'Counsel kickoff. In the same session send the four written questions everything downstream waits on: algo-trading framework applicability, ad pre-approval route, CO/PO eligibility, and education/research segregation in practice.', 'Four questions sent, dated'),
  S('c06', 'T-14', 'compliance', 'Harsh', 4, 'Write the Scanner Lite / Scanner Pro boundary memo in compliance language, not product language: if the user sets the condition it is a tool; if we set it and tell them to act, it is research.', 'Boundary memo for counsel review'),
  S('c07', 'T-14', 'compliance', 'Sanya', 2, 'Write the segregation spec — the operational definition of "separate books": two profit centres, two invoice series, two settlement accounts, a cost-allocation key, separate client registers.', 'Segregation spec'),
  S('p05', 'T-14', 'product', 'Rahul Saraoge', 3, 'Lock the P1 curriculum: 8 modules with learning objectives, plus the written non-cannibalisation rule versus TDP in one sentence a closer can say out loud.', 'Signed curriculum + non-cannibalisation line', 'p02'),
  S('p06', 'T-14', 'product', 'Harsh', 2, 'Define the forward paper-log schema and create the edit-locked, append-only sheet in a restricted Drive folder. This becomes the single most valuable asset the product domain produces.', 'Edit-locked forward paper log'),
  S('p07', 'T-14', 'product', 'Yash', 2, 'Book the freelance video editor with 50% advance; confirm the Kanpur classroom for the Sat 15 / Sun 16 shoot with Operations; check the shoot kit.', 'Editor booked; classroom confirmed'),
  S('s01', 'T-14', 'sales', 'Rahul Saraoge', 3, 'Write the P1 single-call script line by line against the 12–18 minute structure: open, discovery, teach one real thing, offer, close, attach, disposition.', 'P1 script v1'),
  S('s02', 'T-14', 'sales', 'Existing closers (3)', 4, 'Start working the 260+ untouched July leads on the current offer. This is simultaneously revenue, a live objection-harvesting exercise, and the CRM discipline rehearsal.', 'Live objections logged; some revenue'),
  S('m04', 'T-14', 'marketing', 'Yash', 3, 'Create the SECOND brand estate: separate Page, separate ad account and separate Instagram for the research brand, named so nobody can confuse them. Do not publish anything on it yet.', 'Research brand estate created'),
  S('t02', 'T-14', 'tech', 'Abhishek', 3, 'Decide the CRM honestly: Sheets-based Master Tracker versus a real CRM in 13 days. Whichever wins, configure stages, dispositions and the mandatory next-action-date rule.', 'CRM decision + configured stages'),
  S('h03', 'T-14', 'hr', 'Recruiter', 4, 'Phone-screen the first candidate wave. For closers the screen is a 2-minute mock pitch on the phone — hire the voice, train the script.', 'First screened shortlist'),

  // ============ T-13 Thu 13 Aug ============
  S('c08', 'T-13', 'compliance', 'Rahul Saraoge', 3, 'Board resolutions: appoint or formally ratify the Principal Officer and the Compliance Officer, with countersigned written acceptances.', 'Signed board resolutions', 'c01'),
  S('c09', 'T-13', 'compliance', 'Yash', 4, 'Build the Ad Code identity block as a locked Canva master element and an HTML footer snippet, Hindi and English, for both brands: registered name, SEBI number, registered office, brand, CIN, accuracy declaration, ≥10pt risk warning.', 'Locked identity block assets'),
  S('c10', 'T-13', 'compliance', 'Abhishek', 2, 'Start telephony vendor KYC for cloud calling with automatic recording and a pre-call disclosure IVR in Hindi and English.', 'Telephony KYC submitted', 't01'),
  S('p08', 'T-13', 'product', 'Harsh', 0.75, 'FORWARD PAPER-LOG ENTRY #1, before market open — and every trading session thereafter, permanently. Signals timestamped pre-open, never retro-edited. The 30-session clock starts today.', 'Log entry #1', 'p06'),
  S('p09', 'T-13', 'product', 'Harsh', 5, 'Write the versioned Lite/Pro functional split spec: the Lite primitive library, and the Pro fields that must be structurally absent from the Lite API rather than merely hidden in the UI.', 'Split spec v1', 'c06'),
  S('p10', 'T-13', 'product', 'Yash', 4, 'Build the Rigi course shell: 8 module placeholders, drip schedule matching the release calendar, 30-day doubt group, access tied to payment confirmation.', 'Course shell live'),
  S('p11', 'T-13', 'product', 'Rahul Saraoge', 1.5, 'Select and sign the contract product engineer. If nobody is signed today, Scanner Lite\'s go/no-go at T-5 is already a no.', 'Signed SOW; repo access', 'p04'),
  S('s03', 'T-14', 'sales', 'Sales Head / Rahul', 2, 'Publish the locked price book to the floor and brief it: this is the catalogue for the whole sprint, there are no off-book discounts, and bonuses replace discounts.', 'Price book published'),
  S('m05', 'T-13', 'marketing', 'Yash', 4, 'Build the education landing page with the full identity block, the verified multi-layer lead form and pre-qualification fields (capital band, experience, city, language) that feed lead scoring.', 'Education landing page in staging', 'c09'),
  S('t03', 'T-13', 'tech', 'Abhishek', 4, 'Build Make scenario S1 — speed-to-lead: new lead → CRM row → WhatsApp acknowledgement → ping the on-duty closer with name, phone and intent answers.', 'S1 built (untested on live leads)'),
  S('h04', 'T-13', 'hr', 'Ops lead', 3, 'Survey and order the physical floor: desks, chairs, headsets, devices, and an honest power and bandwidth assessment for the Day-1 seat count. Confirm it does not displace classroom or counsellor space.', 'Floor plan + purchase orders'),
  S('f01', 'T-13', 'finance', 'Sanya', 3, 'Draft the price book as a controlled document with Finance as custodian, and map each SKU to its invoice series and settlement account.', 'Draft price book + invoice mapping'),

  // ============ T-12 Fri 14 Aug ============
  S('c11', 'T-12', 'compliance', 'Retained counsel', 6, 'Counsel delivers draft 1 of the client agreement, the MITC document and the risk-profiling questionnaire with scoring bands and its "not suitable" outcome.', 'Draft agreement + MITC + risk questionnaire', 'c02'),
  S('c12', 'T-12', 'compliance', 'Harsh', 4, 'Write the research process note for P2c and P3: coverage universe, methodology, what a positional call is and is not, the mandatory written rationale, review cadence and the conflict declaration.', 'Research process note'),
  S('c13', 'T-12', 'compliance', 'Sanya', 3, 'Draft both refund and advance-fee policies as publishable pages: research (advance capped, pro-rata unexpired period, zero breakage) and education (published policy).', 'Two policy pages drafted'),
  S('p12', 'T-12', 'product', 'Rahul Saraoge', 2, 'Record the seven P0 drip clips (7 × 90 seconds) in one continuous block; Yash cuts. Education only, zero return language.', 'Seven P0 clips raw'),
  S('p13', 'T-12', 'product', 'Harsh', 4, 'Data vendor selected and contracted. Validate the first historical pull by spot-check, not trust: confirm 10 known corporate actions are correctly adjusted and delisted names are present.', 'Licensed, spot-checked historical data', 'p03'),
  S('p14', 'T-12', 'product', 'Harsh', 4, 'Draft the P3 research process document and report template: coverage universe, liquidity rule, idea generation, analyst review, rationale format, review cadence.', 'P3 process + report template'),
  S('s04', 'T-12', 'sales', 'Sales Head', 4, 'Write the 7-touch / 14-day cadence content (call, WhatsApp, call, voice note, WhatsApp, call, breakup) and the day-21 recycle rule. Most reps quit after two touches; touches 3–7 are where 25–35% of the sales live.', 'Cadence content pack'),
  S('m06', 'T-12', 'marketing', 'Yash', 3, 'Install Pixel and Conversions API on both estates; fire and verify Lead, InitiateCheckout and Purchase test events; publish the UTM scheme so CPL traces to creative.', 'Verified event tracking', 'm05'),
  S('f02', 'T-12', 'finance', 'Sanya', 3, 'Confirm GST registration status and the filing calendar with the CA; set the invoice series for both rails; map TDS obligations on freelancers and agencies.', 'GST + TDS position confirmed'),

  // ============ T-11 Sat 15 Aug (Independence Day) ============
  S('c14', 'T-11', 'compliance', 'Rahul Saraoge', 2, 'Banks and registrar are shut, so internal work only. Record the four-minute compliance briefing for the whole floor in Hindi: what we may never say, and why the business ends if we say it.', 'Recorded compliance briefing'),
  S('c15', 'T-11', 'compliance', 'Yash', 4, 'Audit every existing public asset and classify it education or research: both Instagram accounts, the dormant handle, JustDial, WhatsApp presences, all ManyChat keyword flows. Park anything advisory-flavoured.', 'Classified asset register'),
  S('p15', 'T-11', 'product', 'Rahul Saraoge', 6, 'SHOOT BLOCK 1 — classrooms are closed, so this costs zero batch revenue and only the founder\'s holiday. Record P1 Modules 1–3 in chunked lessons.', 'Modules 1–3 raw footage', 'p05'),
  S('s05', 'T-11', 'sales', 'Trainer', 4, 'Build Academy Day-2: the SEBI compliance module and a ≥40-item quiz bank at a 95% pass mark, drafted for CO approval. This is the gate nobody may pass around.', 'Day-2 module + quiz bank'),

  // ============ T-10 Sun 16 Aug (catch-up) ============
  S('c16', 'T-10', 'compliance', 'Rahul Saraoge', 1.5, 'Catch-up day, one exception: read counsel\'s draft agreement and MITC end to end and mark every clause the business cannot operationally honour on Day 1.', 'Marked-up agreement', 'c11'),
  S('p16', 'T-10', 'product', 'Yash', 6, 'SHOOT BLOCK 2 (buffer): Rahul records Modules 4–5 raw so the dated release calendar is not single-threaded on a future shoot; Harsh records the technical segments.', 'Modules 4–5 raw footage'),

  // ============ T-9 Mon 17 Aug ============
  S('c17', 'T-9', 'compliance', 'Rahul Saraoge', 2, 'THE DECISION, forced today rather than discovered at T-1: on the evidence of the registration file and the board resolutions, does the research line open on 26 Aug or is it formally deferred? Sign either way.', 'Signed research go/defer decision', 'c08'),
  S('c18', 'T-9', 'compliance', 'Compliance & Documentation Executive', 6, 'Seed the M9 fee-cap ledger before it is needed: every existing customer who has ever paid for anything resembling a research service enters the family ledger with historical charges.', 'Seeded fee-cap ledger'),
  S('c19', 'T-9', 'compliance', 'Sanya', 3, 'Stand up two settlement rails: separate payment-link groups tagged RA and EDU settling into two named accounts, with link creation permissions restricted.', 'Two settlement rails live'),
  S('p17', 'T-9', 'product', 'Contract product engineer', 8, 'Implement the Scanner Lite data pipeline and primitive library against the spec; Harsh reviews computed values against manual calculation rather than trusting the output.', 'Lite pipeline v1', 'p11'),
  S('p18', 'T-9', 'product', 'Harsh', 4, 'Write the BACK-TEST PROTOCOL DOCUMENT — the artefact that later stops the business fooling itself under revenue pressure. Publishes the numeric launch thresholds in advance.', 'Back-test protocol, dated', 'p13'),
  S('p19', 'T-9', 'product', 'Yash', 5, 'Draft the four P1b sector playbooks from existing batch material with Rahul: how the sector earns money, what drives it, what to read. Concept illustrations only — no view, no target.', 'Four playbook drafts'),
  S('o02', 'T-9', 'offline', 'Ops lead', 3, 'Record the completed offline baselines into OPERATOR M0 and countersign. A tripwire with no baseline cannot trip.', 'Baselines recorded in M0', 'o01'),
  S('s06', 'T-9', 'sales', 'Sales Head', 4, 'Segment the past-student and alumni base into a Desk B working list with contactability marked, and name the two closers being promoted to Desk B.', 'Desk B book + named promotions'),

  // ============ T-8 Tue 18 Aug ============
  S('c20', 'T-8', 'compliance', 'Compliance & Documentation Executive', 4, 'Finalise the agreement and MITC with counsel, onboard the e-sign vendor, load the template with its field map, and execute one test signature end to end.', 'Executable agreement + e-sign live', 'c16'),
  S('c21', 'T-8', 'compliance', 'Yash', 4, 'Put the legal furniture on both landing pages in staging: identity block, accuracy declaration, ≥10pt risk warning, the registration-does-not-guarantee line, and the published refund policy.', 'Both pages legally furnished', 'c09'),
  S('p20', 'T-8', 'product', 'Contract product engineer', 8, 'Build the Lite screen builder: compose from primitives, save up to 5 AND-combined conditions, 3 saved screens on the monthly plan, next-morning digest delivery.', 'Lite screen builder', 'p17'),
  S('p21', 'T-8', 'product', 'Rahul Saraoge', 2.5, 'Write the P4a Kanpur City Workshop: 6.5-hour agenda, 40-seat cap, own classroom (zero venue cost, near-zero cancellation risk), first date fixed 4–6 weeks out.', 'Workshop spec + fixed date'),
  S('s07', 'T-8', 'sales', 'Trainer', 5, 'Build Academy Days 1, 3, 4: company/product module, market fundamentals, and the P1 pitch module with the reference recording, each with its quiz.', 'Academy Days 1/3/4 content'),
  S('t04', 'T-8', 'tech', 'Abhishek', 4, 'Build Make S2 — cash telegraph: gateway payment.captured → Collections row → provisioning trigger → founders-group ping. Every rupee visible in seconds.', 'S2 built', 't03'),
  S('h05', 'T-8', 'hr', 'Recruiter', 5, 'Run floor interviews and role-plays for the closer shortlist; compile scorecards. Target ≥12 interviewed to yield 6 signed.', 'Interview scorecards'),
  S('f03', 'T-8', 'finance', 'Sanya', 3, 'Build the incentive and clawback payout mechanics with Sales: weekly payout from verified collections only, with the 30-day refund clawback computed automatically.', 'Payout mechanics agreed'),

  // ============ T-7 Wed 19 Aug ============
  S('c22', 'T-7', 'compliance', 'Compliance & Documentation Executive', 4, 'Write the KYC and risk-profiling SOP: who collects which document, in what order, where each lands, who scores the profile and who may override — nobody, without the CO.', 'KYC + risk SOP'),
  S('c23', 'T-7', 'compliance', 'Abhishek', 3, 'Lock down research payment-link creation in the gateway so only the Compliance Executive can create an RA-series link, and the fee-cap check precedes link generation.', 'Locked link permissions', 'c19'),
  S('c24', 'T-7', 'compliance', 'Yash', 2, 'Submit the first batch of six research-brand creatives through whatever pre-approval route counsel confirms applies; push the education batch through M6 pre-flight.', 'First creative batches submitted'),
  S('p22', 'T-7', 'product', 'Yash', 4, 'Editor delivers Modules 1–3 cut 1. Review against the cut sheet, check loudness normalisation, burn Hindi captions, export 720p for tier-3 bandwidth.', 'Modules 1–3 cut 1', 'p15'),
  S('p23', 'T-7', 'product', 'Rahul Saraoge', 2.5, 'Write the P4b Mentorship 12-week outline with the faculty-load calculation that sets the seat cap. The arithmetic decides the product: 6 seats, intake at Day 45, not Day 1.', 'Mentorship outline + 6-seat cap'),
  S('p24', 'T-7', 'product', 'Harsh', 1.5, 'Forward-log integrity check #1 and the first weekly paper review: entries complete for every session, zero retro-edits in version history.', 'Integrity check #1', 'p08'),
  S('s08', 'T-7', 'sales', 'Trainer', 5, 'Build Academy Day 5 (objection handling, from the real objections harvested off the July leads) and Day 6 (CRM, dialler, disposition hygiene).', 'Academy Days 5/6 content', 's02'),
  S('m07', 'T-7', 'marketing', 'Yash', 4, 'Produce the first 12 education creatives from shoot footage across the founder-authority and anti-tips angles, and run every one through M6 pre-flight.', '12 creatives in pre-flight'),
  S('o03', 'T-7', 'offline', 'Rahul Saraoge', 2, 'Write and sign the ringfence roster: the named people who may not be pulled onto sprint work, and the immovable founder calendar blocks protecting batch teaching. Tell every named person in person.', 'Signed ringfence roster'),

  // ============ T-6 Thu 20 Aug ============
  S('c25', 'T-6', 'compliance', 'Retained counsel', 4, 'Counsel delivers the written opinion on all four questions sent at T-14: algo framework, ad pre-approval route, CO/PO eligibility, and segregation in practice.', 'Written counsel opinion', 'c05'),
  S('c26', 'T-6', 'compliance', 'Compliance & Documentation Executive', 3, 'Stand up grievance intake: a monitored alias, the escalation matrix published on both brands naming the CO, and the clock rules configured in M9.', 'Grievance intake live'),
  S('p25', 'T-6', 'product', 'Rahul Saraoge', 2, 'Issue the PRODUCT-TRUTH ONE-PAGER to the sales domain — the interlock that stops the floor mis-selling on Day 1: exactly what a P1 buyer gets, when, and what they do not get.', 'Product-truth one-pager', 'p22'),
  S('p26', 'T-6', 'product', 'Contract product engineer', 6, 'Implement the Lite/Pro structural separation: separate deployment, separate domain, separate login, and Pro fields structurally absent from the Lite API.', 'Structural separation shipped', 'p20'),
  S('s09', 'T-6', 'sales', 'Compliance Officer', 3, 'Run the script through the never-say list and sign it off. Record the reference call with the best closer. No script reaches the floor unsigned.', 'Signed script + reference recording', 's01'),
  S('o04', 'T-6', 'offline', 'Rahul Saraoge', 2, 'Write the cannibalisation rule: what P1 at ₹1,999 is (recorded, national, self-serve) versus TDP at ₹15,000 (live, Kanpur, mentored), plus the CRM routing rule sending Kanpur walk-in-intent leads to counsellors, not Desk A.', 'Signed cannibalisation + routing rule'),
  S('f04', 'T-6', 'finance', 'Rahul Saraoge', 2, 'Directors minute the working-capital tranches AND the kill switch: the pre-agreed cash conditions under which spend freezes or the sprint slows.', 'Minuted WC plan + kill switch'),

  // ============ T-5 Fri 21 Aug ============
  S('c27', 'T-5', 'compliance', 'Compliance & Documentation Executive', 3, 'Confirm the AI-use register: walk all 31 M13 agents, set each gate to blocking / review / none, and name an actual human gatekeeper for each — a person, never a module.', 'Completed AI-use register'),
  S('c28', 'T-5', 'compliance', 'Compliance & Documentation Executive', 3, 'Build the call-audit machinery: the QA rubric (disclosure read, any return claim, any never-say phrase, any urgency-by-fear) and the weekly sampling method.', 'QA rubric + sampling method'),
  S('p27', 'T-5', 'product', 'Rahul Saraoge', 2, 'SCANNER LITE GO/NO-GO against the full G-LITE test. A no-go decided today means Lite comes off the Day-1 price list with four days to re-brief the floor — not on launch morning.', 'Signed Lite go/no-go', 'p26'),
  S('p28', 'T-5', 'product', 'Compliance Officer', 1, 'Collect the CO\'s six written, dated confirmations and file them in M9, including that live Lite copy contains no recommendation and Lite is education-classified.', 'Six CO confirmations filed'),
  S('p29', 'T-5', 'product', 'Yash', 3, 'Load the seven P0 drip assets into ManyChat/Make and put all seven through M6 pre-flight so each carries an approver name and timestamp.', 'P0 drip live and approved', 'p12'),
  S('h06', 'T-5', 'hr', 'Sanya', 4, 'Issue and collect ≥6 signed offers with a 26 Aug join date, comp, incentive and the 30-day clawback explained in writing and initialled. Keep a warm bench of ≥3.', '≥6 signed offers + bench', 'h05'),
  S('s10', 'T-5', 'sales', 'Trainer', 5, 'Build Academy Days 7–10: the 20 recorded calls for listening analysis, the supervised-dialling observation sheet, and the certification panel rubric.', 'Academy Days 7–10 content'),

  // ============ T-4 Sat 22 Aug ============
  S('c29', 'T-4', 'compliance', 'Compliance & Documentation Executive', 5, 'FULL DRY RUN of a research sale, screen-recorded end to end with a dummy family. Cap check tested twice: once over cap (must block) and once under (must allow).', 'Screen-recorded dry run + evidence pack', 'c20'),
  S('c30', 'T-4', 'compliance', 'Yash', 3, 'Two-brand crossing test: hand both landing pages, both Instagram profiles and the six submitted creatives to someone outside marketing and ask them to find a path from education to research. They must fail.', 'Crossing-test result', 'c21'),
  S('p30', 'T-4', 'product', 'Sanya', 3, 'ACCEPTANCE TEST #1 — real money, real phone, real network. Sanya and a senior counsellor (neither of whom built anything) buy P1 + P1b on a ₹9,000-class Android over 4G and log every defect.', 'Defect list from live purchase', 'p22'),
  S('p31', 'T-4', 'product', 'Rahul Saraoge', 3, 'SHOOT BLOCK 3 (pickups): the gaps flagged in the cut review plus the Module-1 welcome and disclaimer piece.', 'Pickup footage'),
  S('p32', 'T-4', 'product', 'Harsh', 2.5, 'Write the education validation protocol for the pilot cohort: 30 buyers at FULL price — never a discounted pilot, because a discount tells you nothing about willingness to pay.', 'Education validation protocol'),
  S('t05', 'T-4', 'tech', 'Abhishek', 4, 'Telephony live for the Day-1 seat count with automatic recording and the pre-call disclosure IVR. Place a test call, retrieve it, play it back.', 'Dialler live + recording verified', 'c10'),
  S('m08', 'T-4', 'marketing', 'Media buyer', 3, 'Spend ₹1,000 on a live test ad on the education account to prove the account is genuinely spendable and creatives are not disapproved.', 'Live test spend clean', 'm02'),

  // ============ T-3 Sun 23 Aug (catch-up) ============
  S('c31', 'T-3', 'compliance', 'Rahul Saraoge', 1.5, 'Catch-up day, one exception: read counsel\'s four-question opinion and write down every operational change it forces.', 'Change list from counsel opinion', 'c25'),
  S('p33', 'T-3', 'product', 'Yash', 4, 'Defect closure only: clear every defect from acceptance test #1; editor returns pickup cuts. Nothing new starts today.', 'Defects closed', 'p30'),
  S('s11', 'T-3', 'sales', 'Sales Head', 4, 'FLOOR DRY RUN: the team sells to each other before it sells to a customer. Every existing closer runs the full P1 pitch against the clock and is scored on the QA rubric.', 'Scored dry-run results', 's09'),

  // ============ T-2 Mon 24 Aug ============
  S('c32', 'T-2', 'compliance', 'Compliance & Documentation Executive', 2, 'Rehearse the record that keeps the record: M9 stores in browser localStorage, so a wiped browser is a wiped register. Export every M9 CSV and the JSON backup, then restore into a clean browser.', 'Verified backup + restore drill'),
  S('c33', 'T-2', 'compliance', 'Compliance & Documentation Executive', 3, 'Assemble gate evidence: one folder per gate G-A to G-F, each containing exactly the named artifacts from its pass test and nothing else.', 'Gate evidence pack'),
  S('p34', 'T-2', 'product', 'Harsh', 2, 'PRE-REGISTER THE BACK-TEST RULE before any out-of-sample data is touched: parameters frozen, rule file hashed, N-trials log complete, witnessed by Rahul.', 'Pre-registered, hashed rule', 'p18'),
  S('p35', 'T-2', 'product', 'Sanya', 2.5, 'ACCEPTANCE TEST #2 — full re-test after fixes, plus a live P4a workshop booking that takes payment and issues a seat confirmation. Must come back clean.', 'Clean acceptance test #2', 'p33'),
  S('p36', 'T-2', 'product', 'Rahul Saraoge', 1.5, 'Finalise the Day-1 price list containing ONLY gate-passed SKUs; hand it to Finance and Config with deferred SKUs set to zero planned units.', 'Final Day-1 price list', 'p27'),
  S('t06', 'T-2', 'tech', 'Abhishek', 4, 'Seed OPERATOR: real entity values, real roster with real join dates, real prices, real channels, real cash. Confirm Discovery. Rehearse the nightly backup and name its owner.', 'OPERATOR seeded + backup owner named'),
  S('s12', 'T-2', 'sales', 'Sales Head', 3, 'Timed speed-to-lead drill: drop 20 synthetic leads across the day and measure median and 90th-percentile first-dial time from router timestamps.', 'Timed drill result', 't03'),
  S('f05', 'T-2', 'finance', 'Sanya', 3, 'Run the ₹1 test transaction on each rail; confirm each produces the right invoice series into the right account. Populate the registers to current.', 'Two clean rail tests; registers current', 'c19'),

  // ============ T-1 Tue 25 Aug — final prep day ============
  S('c34', 'T-1', 'compliance', 'Retained counsel', 4, 'Independent gate verification: counsel, who did none of the operational work, tests each of G-A to G-F against its written pass test and records pass or fail with reasons.', 'Counsel gate verification', 'c33'),
  S('p37', 'T-1', 'product', 'Rahul Saraoge', 2, 'PRODUCT GATE REVIEW: walk every product gate with the CO and Sanya, recording evidence and verifier name in M0. G-PRO is expected to fail and is recorded as failed, deliberately.', 'Product gates recorded in M0'),
  S('p38', 'T-1', 'product', 'Harsh', 2.5, 'Brief the trainer on the two Academy product modules: the product-truth module and the one-sentence Lite-versus-Pro difference every closer must be able to say.', 'Trainer briefed'),
  S('t07', 'T-1', 'tech', 'Abhishek', 3, 'Full-system rehearsal: submit a real lead on the real form, take the call on the real dialler, take a real payment, confirm provisioning, confirm it lands in OPERATOR.', 'End-to-end rehearsal passed'),
  S('h07', 'T-1', 'hr', 'Sanya', 2, 'Confirm every Cohort 1 joiner by phone the day before, publish the Day-1 schedule and the weekly-off roster protecting people through 60 days.', 'Confirmed joiners + roster'),
  S('x01', 'T-1', 'compliance', 'Rahul Saraoge', 2, 'GO / NO-GO BOARD, 18:00, all eight domain owners plus counsel. Read the gate states off M0. Any blocking gate not passed and not formally waived in writing means that scope does not launch.', 'Signed launch decision', 'c34'),

  // ============ T-0 Wed 26 Aug — DAY 1 ============
  S('p39', 'T-0', 'product', 'Harsh', 1.5, 'LIVE-FIRE CHECK at 08:30, before the first dial: one real test purchase completes end to end, and one Scanner Lite alert is delivered if Lite passed.', 'Live-fire check passed'),
  S('x02', 'T-0', 'sales', 'Sales Head', 1, '09:00 first huddle: yesterday\'s gate results, today\'s target, one focus. 09:30 the floor dials. The sprint has started.', 'Sprint running'),
]

// ---------------------------------------------------------------- ROLES

export const PREP_ROLES: PrepRole[] = [
  { role: 'Principal Officer / signing authority', person: 'Rahul Saraoge', domain: 'compliance',
    mandate: 'The only person who can sign a board resolution, an engagement letter or a launch authorisation. Owns the T-9 research go/defer decision and the T-1 gate board. Presumptive Principal Officer pending confirmation from the registration file.',
    ownsNumbers: ['22 compliance hours across the window — a hard cap', '6 of 6 gates signed or waived by 18:00 on T-1', '1 research go/defer decision on T-9, not T-1'],
    stopsDoing: 'Hands two weekly batch sessions (one TDP, one Elite) to Harsh and senior faculty for three weeks, and routes every walk-in under ₹50,000 to the senior counsellor — he takes only escalations above that.',
    deliverables: ['Registration file', 'Board resolutions', 'Research go/defer decision', 'Day-1 price list', 'Signed launch decision'] },
  { role: 'Compliance Officer', person: 'HIRE / NAME', domain: 'compliance',
    mandate: 'Sole authority to block. Confirms every rule in the sebi-ra-compliance skill against the current circular before it is relied on. Signs the sign-off chain, the ad register and the fee-cap ledger.',
    ownsNumbers: ['0 research releases without a logged analyst name and timestamp', '0 fee-cap breaches', '100% of grievances closed inside the confirmed clock', '≥5% of connected calls audited per rep per week'],
    stopsDoing: 'If designated from inside the company, that person surrenders every revenue-carrying target on the day of appointment. A Compliance Officer who also carries a sales number cannot say no.',
    deliverables: ['Rule confirmations', 'Ad approvals', 'KYC/risk SOP sign-off', 'AI-use register'] },
  { role: 'Retained RA-compliance counsel', person: 'HIRE (external CS / compliance firm)', domain: 'compliance',
    mandate: 'Drafts the client agreement, MITC and risk-profiling questionnaire; answers the four written questions; independently verifies gates G-A to G-F at T-1 having done none of the operational work.',
    ownsNumbers: ['4 written answers delivered by T-6', '6 gates independently verified at T-1'],
    stopsDoing: 'External engagement — nothing to give up.',
    deliverables: ['Agreement + MITC', 'Eligibility opinions', 'Four-question written opinion', 'Gate verification'] },
  { role: 'Compliance & Documentation Executive', person: 'HIRE (prep-window hire)', domain: 'compliance',
    mandate: 'The hands that make compliance real: seeds the fee-cap ledger, writes the KYC SOP, runs the research dry run, assembles gate evidence, stands up grievance intake. Exists because Sanya cannot absorb this on top of payroll, registers and banking.',
    ownsNumbers: ['Fee-cap ledger seeded before first invoice', 'Gate evidence pack complete by T-2'],
    stopsDoing: 'New hire — no existing load.',
    deliverables: ['Seeded ledger', 'KYC + risk SOP', 'Dry-run recording', 'Gate evidence pack'] },
  { role: 'Product & research owner', person: 'Harsh', domain: 'product',
    mandate: 'Owns the Lite/Pro boundary, the data licence, the back-test protocol and the forward paper log. The forward log is his personal, permanent, pre-open discipline from T-13 onward.',
    ownsNumbers: ['≥30 unedited forward paper sessions logged by ~Day 15', '0 retro-edits in log version history', '10 corporate actions spot-checked correct'],
    stopsDoing: 'Hands his algo batch sessions to senior faculty for the window; picks up two of Rahul\'s batch sessions only after the shoot blocks are complete.',
    deliverables: ['Boundary memo', 'Split spec', 'Back-test protocol', 'Forward paper log', 'P3 process note'] },
  { role: 'Contract product engineer', person: 'HIRE (≈10-day engagement)', domain: 'product',
    mandate: 'Builds Scanner Lite MSV and the structural Lite/Pro separation. There is no engineer on staff; the headcount plan carries two and the actual count is zero.',
    ownsNumbers: ['Lite acceptance test passed by T-5 or Lite is deferred'],
    stopsDoing: 'New engagement — no existing load.',
    deliverables: ['Lite data pipeline', 'Screen builder', 'Structural separation'] },
  { role: 'Content, creative & course production', person: 'Yash', domain: 'marketing',
    mandate: 'Produces the course shell, the creative bank, both landing pages, the identity blocks and the P0 drip; runs the two-brand crossing test. The single busiest non-founder in the window.',
    ownsNumbers: ['≥12 approved education creatives by T-2', '7 P0 assets approved', 'Crossing test failed by an outsider'],
    stopsDoing: 'Drops the @ctc_kanpur giveaway cadence and the dormant-handle relaunch until after Day 1; organic posting reduces to a maintenance schedule on the founder handle only.',
    deliverables: ['Course shell', 'Landing pages', 'Identity blocks', 'Creative bank', 'Playbook PDFs'] },
  { role: 'Automation & systems', person: 'Abhishek', domain: 'tech',
    mandate: 'Owns every wire: lead router, telephony, gateway hooks, provisioning, OPERATOR seeding and backups. Single point of failure for the entire lead-to-cash path.',
    ownsNumbers: ['Median first-dial under 5 minutes in the timed drill', 'Payment-to-access under 15 minutes', '0 unlogged human retyping points'],
    stopsDoing: 'Nothing to drop — has the most genuine spare capacity of the named five. But a named backup must be briefed on S1 and S2, because three days of his absence launches Desk A blind.',
    deliverables: ['Shared Drive', 'S1/S2 scenarios', 'Dialler', 'CRM config', 'Seeded OPERATOR'] },
  { role: 'Back office — HR, payroll, registers, banking', person: 'Sanya', domain: 'hr',
    mandate: 'Offers and joiners, the money rails, the registers, and the independent acceptance tests. Deliberately relieved of compliance documentation and recruitment sourcing.',
    ownsNumbers: ['≥6 signed offers with a 26 Aug join date', 'Two clean rail tests', 'Registers current by T-2', 'Her own prep load under 6 hours a week'],
    stopsDoing: 'Hands candidate sourcing and screening to contracted recruitment support, and compliance documentation to the Compliance & Documentation Executive. Without both handoffs she is the plan\'s breaking point.',
    deliverables: ['Signed offers', 'Settlement rails', 'Refund policies', 'Acceptance tests', 'Current registers'] },
  { role: 'Recruitment support', person: 'HIRE (contracted for the window)', domain: 'hr',
    mandate: 'Runs the 36-candidate pipeline to 6 signed offers plus a bench of 3, so the founder and Sanya only see finalists.',
    ownsNumbers: ['≥36 sourced', '≥12 interviewed', '≥6 signed', '≥3 on the bench'],
    stopsDoing: 'Contracted — no existing load.',
    deliverables: ['Screened shortlist', 'Interview scorecards', 'Signed offers'] },
  { role: 'Sales Head / Growth Owner', person: 'NAME ON T-15', domain: 'sales',
    mandate: 'The throat to choke for the number. Owns the script, the cadence, Desk B\'s book, the drills and the daily rhythm from Day 1. If this is Rahul, it must be explicit — and his other loads must shrink accordingly.',
    ownsNumbers: ['Median speed-to-lead under 5 minutes', 'Scored dry run completed by every closer', 'Desk B book segmented and named'],
    stopsDoing: 'If drawn from the existing floor, surrenders a personal closing target for the window.',
    deliverables: ['Script', 'Cadence pack', 'Desk B book', 'Dry-run scores', 'Day-1 huddle'] },
  { role: 'Trainer / Academy builder', person: 'HIRE or senior closer', domain: 'sales',
    mandate: 'Builds all ten Academy days as actual content — decks, quiz banks, role-plays, the 20 listening calls and the certification rubric. Runs Cohort 1 from Day 1.',
    ownsNumbers: ['Days 1–5 content complete by T-3', 'Day-2 quiz bank ≥40 items at 95% pass'],
    stopsDoing: 'If a senior closer, comes off the phones for the window and returns to a Desk B book afterwards.',
    deliverables: ['Ten Academy days', 'Quiz banks', 'Role-play scenarios', 'Certification rubric'] },
  { role: 'Media buyer', person: 'HIRE', domain: 'marketing',
    mandate: 'Owns verification follow-through, account health, the test spend, and CPL from Day 1.',
    ownsNumbers: ['One channel verified and spendable by T-2', 'Clean ₹1,000 test spend', 'CPL against plan from Day 1'],
    stopsDoing: 'New hire — no existing load.',
    deliverables: ['Verified account', 'Campaign structure', 'Test spend result'] },
  { role: 'Operations lead — offline ringfence', person: 'Existing ops lead', domain: 'offline',
    mandate: 'Measures and guards the offline baselines, builds the physical floor without displacing classroom or counsellor space, and raises the tripwire the moment one trips.',
    ownsNumbers: ['5 baselines recorded before anything changes', 'Batch fill % held', 'Walk-in response time held'],
    stopsDoing: 'Nothing — this role exists precisely so the offline business keeps its own advocate while everyone else chases the new number.',
    deliverables: ['Baselines', 'Floor build', 'Weekly offline health report'] },
]

// ---------------------------------------------------------------- TOOLS

export const PREP_TOOLS: PrepTool[] = [
  { tool: 'Cloud telephony with recording', purpose: 'Dial capacity for the floor with automatic recording and a pre-call disclosure IVR in Hindi and English. Recording is a compliance requirement, not a nice-to-have.', domain: 'tech', owner: 'Abhishek', costInrMonthly: 25000, leadTime: '5–8 days (vendor KYC is the delay) — starts T-13', failureMode: 'No recordings means no call audit, no QA, and no defence if a mis-selling allegation lands.' },
  { tool: 'Make.com Core (upgrade from Free)', purpose: 'Lead routing, speed-to-lead ping, cash telegraph, provisioning triggers.', domain: 'tech', owner: 'Abhishek', costInrMonthly: 900, leadTime: 'Same day', failureMode: 'Free plan (1,000 ops, 2 scenarios) exhausts within days; leads arrive and nobody is told.' },
  { tool: 'WhatsApp Business API + DLT registration', purpose: 'Lead acknowledgement, the 7-touch cadence, P0 drip, and an owned channel no platform can take away.', domain: 'marketing', owner: 'Yash', costInrMonthly: 5000, leadTime: '7–14 days external — must start T-15', failureMode: 'Cadence falls back to manual WhatsApp from personal numbers, which is both slower and a data-protection problem.' },
  { tool: 'Market data feed (EOD adjusted OHLCV, corporate actions, point-in-time constituents)', purpose: 'Powers Scanner Lite screens and the entire back-test. Point-in-time constituents and retained delisted names are what separate an honest back-test from a fantasy.', domain: 'product', owner: 'Harsh', costInrMonthly: 9000, leadTime: '3–7 days licensing paperwork — longest lead in the product domain', failureMode: 'No Scanner Lite and no defensible back-test; survivorship bias makes any result meaningless.' },
  { tool: 'Contract product engineer (≈10 days)', purpose: 'Builds Scanner Lite MSV and the structural Lite/Pro separation.', domain: 'product', owner: 'Rahul Saraoge', costInrMonthly: 150000, leadTime: '3–5 days to source; must be signed by T-13', failureMode: 'Scanner Lite does not launch; ~₹4.4L/month of plan moves out of Day 1.' },
  { tool: 'E-signature vendor', purpose: 'Client agreement and MITC executed with a downloadable audit trail.', domain: 'compliance', owner: 'Compliance & Documentation Executive', costInrMonthly: 2000, leadTime: '2–3 days', failureMode: 'Research onboarding cannot complete; no agreement means no lawful research service.' },
  { tool: 'Google Shared Drive (5C-COMPLIANCE)', purpose: 'The records vault — registration, agreements, client files, ad approvals, audit evidence. A Shared Drive, never a personal one.', domain: 'compliance', owner: 'Abhishek', costInrMonthly: 0, leadTime: 'Same day', failureMode: 'Records held in a personal account vanish when that person leaves — a retention breach waiting to happen.' },
  { tool: 'Rigi (course + community delivery)', purpose: 'P1 hosting, module drip, 30-day doubt group, payment-linked access.', domain: 'product', owner: 'Yash', costInrMonthly: 3000, leadTime: '1 day configuration', failureMode: 'Nowhere to deliver the course a buyer just paid for.' },
  { tool: 'Payment gateway — two rails (Razorpay / Cashfree)', purpose: 'Separate RA and EDU link groups settling into separate named accounts, with the fee-cap check preceding link generation.', domain: 'finance', owner: 'Sanya', costInrMonthly: 0, leadTime: '2–4 days for the second rail', failureMode: 'Mixed books, wrong invoice series, and a fee-cap ledger that cannot be trusted.' },
  { tool: 'Freelance video editor', purpose: 'Cuts 3.0–3.5h of finished chunked lessons with Hindi captions at 720p.', domain: 'product', owner: 'Yash', costInrMonthly: 20000, leadTime: '2 days; booked T-14 with 50% advance', failureMode: 'Raw footage stays raw and the P1 course does not ship.' },
  { tool: 'Test devices (₹9,000-class Android + prepaid 4G)', purpose: 'Acceptance testing on the hardware and network the actual tier-2/3 buyer has, not on the team\'s phones.', domain: 'product', owner: 'Yash', costInrMonthly: 300, leadTime: '1 day', failureMode: 'The course "works" on a flagship and buffers on a buyer\'s phone — the refund driver nobody predicted.' },
  { tool: 'Retained RA-compliance counsel', purpose: 'Agreement drafting, eligibility opinions, the four-question opinion, and independent gate verification at T-1.', domain: 'compliance', owner: 'Rahul Saraoge', costInrMonthly: 75000, leadTime: 'Engaged T-15', failureMode: 'The business self-certifies its own compliance, which is exactly the fact pattern regulators punish.' },
  { tool: 'Recruitment support (contracted)', purpose: 'Runs a 36-candidate pipeline to 6 signed offers plus a bench.', domain: 'hr', owner: 'Sanya', costInrMonthly: 40000, leadTime: 'Engaged T-15', failureMode: 'Cohort 1 does not join on Day 1, and the entire calendar advantage of the runway is lost.' },
  { tool: 'Compliance & Documentation Executive', purpose: 'The hands behind the fee-cap ledger, the KYC SOP, the dry run and the evidence pack.', domain: 'hr', owner: 'Rahul Saraoge', costInrMonthly: 30000, leadTime: 'Engaged by T-8', failureMode: 'Sanya becomes the bottleneck and compliance evidence arrives late or not at all.' },
  { tool: 'Physical floor (desks, headsets, devices, power, bandwidth)', purpose: 'Seats for the Day-1 floor without displacing classroom or counsellor space.', domain: 'hr', owner: 'Ops lead', costInrMonthly: 0, leadTime: '5–7 days procurement; load-tested by T-3', failureMode: 'People arrive on Day 1 with nowhere to sit and no line to dial — the most avoidable failure on this list.' },
]

// ---------------------------------------------------------------- TRIPWIRES

export const TRIPWIRES: Tripwire[] = [
  { metric: 'Monthly offline fee income', threshold: 'Falls below 90% of the T-9 baseline for two consecutive weeks', action: 'Founder returns to his full batch teaching load and the sprint\'s claim on his calendar is cut to the war room and shoot blocks only. Offline recovery outranks the sprint number.', owner: 'Rahul Saraoge' },
  { metric: 'Batch fill %', threshold: 'Any batch opens below 70% of seats when the baseline was higher', action: 'Counsellors come off any sprint support work immediately and return full-time to walk-in and enquiry conversion. Local campaign spend shifts to batch enquiries.', owner: 'Ops lead' },
  { metric: 'Walk-in enquiry response time', threshold: 'Any walk-in or local enquiry waits longer than the baseline response time', action: 'Ringfence breach — investigate who was pulled onto sprint work and reverse it the same day.', owner: 'Ops lead' },
  { metric: 'Student NPS (existing batches)', threshold: 'Falls below 8, or any cohort drops more than 1 point from baseline', action: 'Founder runs a session with that cohort that week; faculty load is rebalanced before any new sprint work is accepted.', owner: 'Ops lead' },
  { metric: 'Faculty teaching load', threshold: 'Any faculty member covering more than 1.5× their baseline sessions for two weeks', action: 'Stop reassigning batches; hire or contract relief faculty before taking another hour from teaching.', owner: 'Rahul Saraoge' },
  { metric: 'TDP / classroom enquiry-to-admission rate', threshold: 'Drops materially against baseline while P1 online sales rise', action: 'Cannibalisation is real, not theoretical. Enforce the routing rule sending Kanpur-area walk-in-intent leads to counsellors, and re-brief the floor on the P1-versus-TDP distinction the same week.', owner: 'Sales Head + Ops lead' },
  { metric: 'Key-person availability', threshold: 'Rahul, Sanya, Abhishek or Harsh unavailable for more than two consecutive working days', action: 'Activate the named backup for that person\'s critical path. If no backup is named for a critical path, that is itself the finding — name one this week.', owner: 'Rahul Saraoge' },
  { metric: 'Floor attrition', threshold: 'Any closer resignation in the first fortnight, or two in any month', action: 'Same-week exit conversation by the founder personally, and a pay/roster review before backfilling. People leave when pay wobbles or targets feel rigged.', owner: 'Sanya' },
]
