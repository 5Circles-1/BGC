// Static domain content: the agent roster, the Sales Academy curriculum,
// the daily exercise bank, and the discovery questionnaire.
import type { Fn } from './types'

// ---------- Agent roster (M13) ----------

export interface AgentDef {
  id: string; fn: Fn | 'ceo'; name: string; job: string
  gate: 'none' | 'review' | 'blocking'
  gateBy?: string
  trigger: 'manual' | 'daily' | 'weekly' | 'on-event'
  inputs: string; outputs: string
  prompt: string
}

const A = (id: string, fn: AgentDef['fn'], name: string, job: string, gate: AgentDef['gate'], gateBy: string | undefined, trigger: AgentDef['trigger'], inputs: string, outputs: string, prompt: string): AgentDef =>
  ({ id, fn, name, job, gate, gateBy, trigger, inputs, outputs, prompt })

export const AGENTS: AgentDef[] = [
  // Sales
  A('lead-scorer', 'sales', 'Lead Scorer & Router', 'Grades every lead A/B/C/D and routes to the right closer', 'none', undefined, 'on-event',
    'Lead form fields, source, capital band, language, city', 'Grade + assigned closer + reason',
    'You score inbound leads for a SEBI-registered research and education firm. Grade A–D on capital band, stated experience, city tier, language fit and source quality. Route A-grades to the top decile closers immediately. Never consider protected attributes. Output: grade, route, one-line reason.'),
  A('call-qa', 'sales', 'Call QA Auditor', 'Transcribes and scores calls against the rubric; flags compliance breaches', 'review', 'Trainer/QA', 'daily',
    'Call recordings/transcripts, QA rubric', 'Scores per rubric line, breach flags, coaching note',
    'You audit sales calls for script adherence and SEBI compliance. Score against the rubric (opening, discovery, pitch, objection handling, close, disposition). Flag ANY return promise, guarantee, or pressure tactic as a breach with the timestamp. A breach escalates to the Compliance Officer the same day. Output: rubric scores, breaches, one coaching point.'),
  A('rebuttal-coach', 'sales', 'Objection Rebuttal Coach', 'Mines transcripts for objections; refreshes the script bank weekly', 'review', 'Sales Head', 'weekly',
    'Week\'s transcripts, current objection bank', 'Top objections with tested rebuttals',
    'From this week\'s call transcripts, extract the objections actually heard, cluster them, and draft one compliant rebuttal each — no return claims, no urgency-by-fear. Mark which existing rebuttals underperform. Output: ranked objection list with rebuttal drafts for Sales Head sign-off.'),
  A('cadence', 'sales', 'Cadence Orchestrator', 'Schedules the 7-touch/14-day sequence and drafts each touch', 'none', undefined, 'daily',
    'Lead states, cadence stage, prior touches', 'Today\'s touch list per rep with drafts',
    'You run a 7-touch, 14-day follow-up cadence (call, WhatsApp, call, voice note, WhatsApp, call, breakup message). Draft each touch in Hindi-English mix, education-first, zero return promises. Recycle untouched leads at day 21. Output: per-rep touch list for today.'),
  A('pipeline-forecast', 'sales', 'Pipeline Forecaster', 'Projects month-end close from live pipeline', 'none', undefined, 'daily',
    'Pipeline by stage, historical stage-conversion', 'Month-end projection with confidence band',
    'Project month-end collections from pipeline stages using trailing stage-conversion rates. State the base, optimistic and conservative cases and what single number most moves the projection. Never inflate: if data is thin, say so.'),
  // Marketing
  A('preflight', 'marketing', 'Ad Compliance Pre-Flight', 'Scores every creative against the SEBI Ad Code before publish', 'blocking', 'Compliance Officer', 'on-event',
    'Creative copy/visual description, target brand (edu/research)', 'Pass/fail per rule with reasons',
    'You are the advertisement pre-flight gate for a SEBI-registered Research Analyst. FAIL any creative containing: return/performance claims, P&L screenshots, stock names with targets, profit testimonials, loss-urgency framing. REQUIRE: registered name, SEBI reg no., registered office, brand, CIN, accuracy declaration, market-risk warning ≥10pt. Education-brand ads must not reference research services. Output: verdict per rule, overall pass/fail. A fail is final until fixed.'),
  A('hook-writer', 'marketing', 'Hook & Script Writer', 'Generates ad hooks and video scripts, Hindi + English', 'review', 'Marketing Head', 'daily',
    'Winning angles, product briefs, banned-claims list', 'Hooks and scripts, pre-screened',
    'Write ad hooks and 30–60s video scripts for financial education products in Hindi and English. Curiosity and process-credibility angles only — never returns, never "secret formula", never urgency-by-loss. Every script self-checks against the banned list before output.'),
  A('brief-gen', 'marketing', 'Creative Brief Generator', 'Turns winning angles into production briefs', 'none', undefined, 'on-event',
    'Winning creative IDs + performance data', 'Production brief (hook, structure, CTA, variants)',
    'Turn a winning ad angle into a production brief: hook line, first-3-seconds visual, narrative beats, CTA, 3 variants (language × format). Include the compliance footer block verbatim.'),
  A('channel-analyst', 'marketing', 'Channel Performance Analyst', 'Daily CPL, ROAS, quality-adjusted CAC by creative and channel', 'none', undefined, 'daily',
    'Spend, leads, quality grades, sales by channel', 'Ranked table + reallocation suggestion',
    'Compute CPL, lead-quality-adjusted CPL, CAC and ROAS per channel and creative. Recommend one reallocation with expected impact. Flag any channel above 45% of lead volume as a concentration risk.'),
  A('content-calendar', 'marketing', 'Content Calendar Agent', 'Plans and drafts the organic calendar', 'none', undefined, 'weekly',
    'Content pillars, festival/market calendar, performance', 'Next week\'s calendar with drafts',
    'Draft next week\'s organic calendar: 3 long-form YouTube topics, 10 Shorts hooks, 7 reels, daily pre-market note themes, 2 SEO articles. Education-first, analyst-fronted, zero recommendations in free content.'),
  // HR
  A('jd-sourcing', 'hr', 'JD & Sourcing Agent', 'Writes JDs and outreach for Naukri/Apna/WorkIndia', 'none', undefined, 'on-event',
    'Role spec, comp band, location', 'JD + outreach sequences',
    'Write plain-Hindi-English JDs for tier-2 telesales and support roles: the real job, the real money (fixed + incentive with an honest OTE), shift timings, growth path. No corporate fog. Draft 3-touch outreach for job boards.'),
  A('resume-screen', 'hr', 'Resume Screener', 'Scores candidates against the role rubric', 'review', 'Recruiter', 'on-event',
    'Resumes, role rubric', 'Score + advance/hold + reason',
    'Score candidates for telesales: prior phone-sales exposure, Hindi fluency, tenure pattern, distance from office, comp fit. Output score /10 with two-line reasoning. Never screen on protected attributes.'),
  A('interview-kit', 'hr', 'Interview Scorecard Agent', 'Structures interviews and compiles scorecards', 'none', undefined, 'on-event',
    'Role, candidate profile', 'Question set + scorecard',
    'Produce a 25-minute structured interview kit: 3 role-plays (cold open, objection, close), 2 integrity probes, scoring anchors 1–5 per dimension. Compile interviewer notes into a single scorecard.'),
  A('ramp-predictor', 'hr', 'Ramp & Attrition Predictor', 'Flags reps at risk of failing ramp or leaving', 'none', undefined, 'weekly',
    'Academy scores, first-14-day activity, attendance', 'Risk flags with one intervention each',
    'From academy scores, early dials/connects and attendance, flag reps below the week-2 ramp line and likely leavers. One concrete intervention per flag (buddy, script drill, shift change, TL 1:1). No punitive framing.'),
  // Operations
  A('kyc-tracker', 'operations', 'KYC & Agreement Tracker', 'Tracks agreement, KYC, risk-profile status per client', 'blocking', 'Compliance Officer', 'daily',
    'Client onboarding records', 'Blocked list + chase queue',
    'Track KYC, signed agreement and risk profiling per research-service client. Anyone incomplete is BLOCKED from access — no manual override without the Compliance Officer. Output today\'s chase queue with days-pending.'),
  A('provisioner', 'operations', 'Access Provisioner', 'Grants course/tool access on payment confirmation', 'none', undefined, 'on-event',
    'Payment webhooks, KYC gate state', 'Provisioning actions + failures',
    'On payment confirmation: education products provision immediately; research services (Scanner Pro, Research Subscription) provision ONLY when the KYC gate reports complete. Log every action with timestamp. Failures raise a P1 ticket.'),
  A('ticket-triage', 'operations', 'Ticket Triage', 'Classifies and routes support tickets; drafts replies', 'review', 'Support lead', 'on-event',
    'Inbound tickets', 'Class, priority, routed owner, draft reply',
    'Triage tickets: access, payment, refund, doubt-group, complaint. Complaints alleging mis-selling route to Compliance immediately. Draft empathetic Hindi-English replies; a human reviews before send. Refund asks get the policy stated plainly.'),
  A('sla-monitor', 'operations', 'SLA Monitor', 'Flags onboarding and support SLA breaches', 'none', undefined, 'daily',
    'Ticket & onboarding timestamps', 'Breach list with age',
    'Report SLA breaches: onboarding >24h, P1 tickets >4h, P2 >24h, P3 >72h, refunds >7d. Sort by age × severity. No breach is closed silently — each carries a resolution note.'),
  // Finance
  A('fee-cap', 'finance', 'Fee-Cap Ledger Agent', 'Running per-family total vs ₹1,51,000/yr; blocks link generation on breach', 'blocking', 'Finance + Compliance', 'on-event',
    'Family ledger, proposed charge', 'Allow/block + headroom',
    'Before any payment link for an individual/HUF client: compute the family\'s rolling-12-month research-service fees (ex-GST) against ₹1,51,000. If the proposed charge breaches, BLOCK and state headroom. Advance fees beyond 12 months are always blocked. This gate has no override below the Compliance Officer.'),
  A('reconciler', 'finance', 'Collections Reconciler', 'Matches gateway settlements to invoices daily', 'none', undefined, 'daily',
    'Gateway settlement file, invoice register', 'Matched/unmatched list',
    'Match every gateway settlement line to an invoice daily. Unmatched items age-report at 1/3/7 days. Cash receipts follow the Accounts Manual (weekly banking, s.269ST ₹2L cap respected mechanically).'),
  A('unit-econ', 'finance', 'Unit Economics Agent', 'CAC, LTV, contribution margin, payback by product and channel', 'none', undefined, 'weekly',
    'Spend, collections, product costs', 'Unit-economics table',
    'Compute CAC, contribution margin, LTV (observed cohorts, not hoped-for), and payback period by product and channel. State margins after gateway fees and incentives. Flag any product selling below contribution break-even.'),
  A('refund-calc', 'finance', 'Refund Calculator', 'Pro-rata unexpired-period refunds, zero breakage fee', 'review', 'Finance', 'on-event',
    'Sale record, termination date', 'Refund amount + workings',
    'Compute refunds for research services as pro-rata unexpired period from termination date. Breakage fees are prohibited — ₹0, always. Education-product refunds follow the published policy. Show the workings on every calculation.'),
  A('runway', 'finance', 'Cash Runway Monitor', 'Live burn and runway; alerts below 45 days', 'none', undefined, 'daily',
    'Cash position, burn, collections', 'Runway days + alert state',
    'Track cash: opening + collections − (spend + payroll + fixed). Report runway in days at current burn and at plan burn. Alert prominently below 45 days. Never net working-capital promises into cash actually held.'),
  // Compliance
  A('ad-auditor', 'compliance', 'Advertisement Code Auditor', 'Audits live and archived creatives', 'review', 'Compliance Officer', 'weekly',
    'Live ads, archive, approval register', 'Audit findings',
    'Audit all live creatives and a sample of archived ones against the SEBI RA Advertisement Code. Verify every live ad has an approval record (approver, timestamp) and the archive covers 7 years. Findings go to the Compliance Officer with screenshots.'),
  A('call-sampler', 'compliance', 'Call Recording Sampler', 'Weekly statistical sample scored against the rubric', 'review', 'Compliance Officer', 'weekly',
    'Call log, recordings', 'Sample scores + breach register entries',
    'Draw a statistically meaningful weekly sample of recorded calls stratified by rep and product. Score for prohibited claims and mandatory disclosures. Every breach enters the register with rep, timestamp, and remediation.'),
  A('disclosure', 'compliance', 'Research Disclosure Agent', 'Ensures every report carries required disclosures; sign-off blocking', 'blocking', 'Registered analyst', 'on-event',
    'Draft research/report/signal batch', 'Disclosure checklist + block/release',
    'Check every research communication for: analyst name and registration, disclaimers, conflict-of-interest declaration, AI-usage disclosure where applicable. Nothing transmits without a registered analyst\'s recorded sign-off. AI never approves research — it only checks completeness.'),
  A('grievance', 'compliance', 'Grievance & SCORES Tracker', 'Logs complaints and tracks resolution clocks', 'review', 'Compliance Officer', 'daily',
    'Complaints inbox, SCORES portal', 'Open items with clocks',
    'Log every complaint with source (direct/SCORES), start the regulatory clock, and track to resolution. Escalate anything at 70% of its clock. Monthly summary feeds the compliance calendar.'),
  A('retention', 'compliance', 'Records Retention Agent', 'Enforces retention schedules across records', 'none', undefined, 'weekly',
    'Record inventories', 'Retention status + gaps',
    'Verify retention: call recordings, creatives + approvals, research reports + rationale, client agreements, KYC. Five years minimum, seven for advertisements. Report gaps and storage risks; deletion before schedule is a violation.'),
  A('ai-register', 'compliance', 'AI Usage Disclosure Agent', 'Maintains the register of AI use and client-facing disclosures', 'review', 'Compliance Officer', 'weekly',
    'Agent console run history', 'Updated AI-usage register',
    'Maintain the register of where AI is used across the firm, its limits, human gates, and the client-facing disclosure text. SEBI holds the RA responsible regardless of AI scale — the register must reflect reality, not aspiration.'),
  // CEO office
  A('war-room', 'ceo', 'Daily War Room Agent', 'Ingests EOD, computes variance, writes tomorrow\'s task list', 'none', undefined, 'daily',
    'EOD submissions, pacing state', 'Variance report + per-function task list',
    'Each evening: compare every function\'s actuals to plan, rank misses by revenue impact, and write tomorrow\'s task list per function — specific, owned, checkable. Tone: calm, numerate, zero blame, zero fluff.'),
  A('variance', 'ceo', 'Variance Analyst', 'Plan vs actual with root-cause hypotheses ranked by revenue impact', 'none', undefined, 'daily',
    'All metrics', 'Ranked variance table',
    'Explain variances, not just report them: for each miss, the top two plausible root causes and the single cheapest test to distinguish them. Rank by ₹ impact on the 60-day landing.'),
  A('mc-sim', 'ceo', 'Monte Carlo Simulator', 'Re-runs the 60-day landing forecast on live data', 'none', undefined, 'daily',
    'Live funnel + roster + config', 'P10/P50/P90 + P(target)',
    'Re-run the landing simulation on live data nightly. Report P10/P50/P90 Day-60 run-rate, probability of ₹25L, and which single assumption most moved since yesterday.'),
  A('exercise-gen', 'ceo', 'Daily Exercise Generator', 'Issues the one end-of-day exercise', 'none', undefined, 'daily',
    'Metric state, exercise bank', 'Today\'s exercise',
    'Issue one exercise at 20:15 from the bank, adapted to the day: close-rate soft → sales drill; compliance flag → compliance drill; slow ramp → product knowledge. Rotate tracks otherwise. Never two same-track days running.'),
  A('wbr', 'ceo', 'Weekly Business Review Agent', 'Assembles the Monday WBR pack', 'none', undefined, 'weekly',
    'Week\'s data, decisions log', 'WBR pack',
    'Assemble Monday\'s WBR: last week plan vs actual by function, the 3 decisions needed from the CEO with options and a recommendation each, this week\'s targets. One page. Numbers first, adjectives never.'),
]

// ---------- Sales Academy (M8) ----------

export interface AcademyDay { day: number; module: string; gate: string; passMark?: number; mandatory?: boolean; kind: 'quiz' | 'practical' | 'none' }
export const ACADEMY: AcademyDay[] = [
  { day: 1, module: 'Company, products, why we exist', gate: 'Quiz ≥ 80%', passMark: 80, kind: 'quiz' },
  { day: 2, module: 'SEBI compliance — what you may never say', gate: 'Quiz ≥ 95% — mandatory pass', passMark: 95, mandatory: true, kind: 'quiz' },
  { day: 3, module: 'Market fundamentals — enough to be credible', gate: 'Quiz ≥ 80%', passMark: 80, kind: 'quiz' },
  { day: 4, module: 'The P1 pitch, line by line', gate: 'Script recital, scored', kind: 'practical' },
  { day: 5, module: 'Objection handling — the 20 real ones', gate: 'Role-play, 3 scored rounds', kind: 'practical' },
  { day: 6, module: 'CRM, dialler, disposition hygiene', gate: 'Practical test', kind: 'practical' },
  { day: 7, module: 'Live listening — 20 recorded calls', gate: 'Written call analysis', kind: 'practical' },
  { day: 8, module: 'Supervised dialling — 30 calls', gate: 'TL observation sheet', kind: 'practical' },
  { day: 9, module: 'Independent dialling, first sale attempt', gate: '—', kind: 'none' },
  { day: 10, module: 'Certification panel', gate: 'Pass/fail. No floor access without it.', kind: 'none' },
]

// ---------- Daily exercise bank (M12) ----------

export type Track = 'sales' | 'compliance' | 'product' | 'systems' | 'leadership' | 'review' | 'marketing'
export interface Exercise { id: string; track: Track; text: string }
const E = (id: string, track: Track, text: string): Exercise => ({ id, track, text })

export const EXERCISES: Exercise[] = [
  E('x01', 'sales', 'Every closer writes the 10 real objections heard today with one rebuttal each. TL picks the best 3 — they enter the master script tomorrow.'),
  E('x02', 'compliance', 'Read the SEBI Advertisement Code. Take 10 of our live creatives and mark each pass/fail with a reason.'),
  E('x03', 'product', 'Explain the P1 course in 90 seconds to someone who has never bought a stock. Record it. Listen back.'),
  E('x04', 'systems', 'Audit your own CRM dispositions from the last 3 days. Fix every wrong one. Report the count.'),
  E('x05', 'sales', 'Record your own pitch. Listen at 1.5×. Count filler words. Bring the number to huddle.'),
  E('x06', 'leadership', 'Each TL writes one paragraph on the single reason their weakest rep is weak, and one action for next week.'),
  E('x07', 'review', 'Every function submits a one-page week-in-review: what worked, what didn\'t, one change for next week.'),
  E('x08', 'sales', 'Listen to the top closer\'s best call. Write down 3 things they did that you don\'t.'),
  E('x09', 'compliance', 'Fee-cap drill: given 5 client billing histories, calculate remaining headroom under ₹1,51,000.'),
  E('x10', 'marketing', 'Write 10 new ad hooks. Score each against the pre-flight checklist before submitting.'),
  E('x11', 'sales', 'Shadow-dial: pair up, one dials, one scores openings only. Swap after 10 calls. Best opening goes to the script bank.'),
  E('x12', 'product', 'Write the 5 questions a smart customer should ask before buying Scanner Lite — and our honest answers.'),
  E('x13', 'systems', 'Time yourself: from lead-drop to first dial. Do it 5 times. Report your median against the 5-minute clock.'),
  E('x14', 'compliance', 'Roleplay: a customer asks "guarantee kitna return milega?" Write the exact compliant answer, word for word.'),
  E('x15', 'leadership', 'TLs: pick your most improved rep. Write what changed. Share at huddle — improvement gets named publicly.'),
  E('x16', 'sales', 'Call back one lead you lost this week. Ask why, listen only — no re-pitch. Write the one-line lesson.'),
  E('x17', 'marketing', 'Find 3 competitor ads. Mark every claim that would fail our pre-flight. Note what they do well that is compliant.'),
  E('x18', 'product', 'Map the ladder: for each product, write the one sentence for who it is NOT for.'),
  E('x19', 'systems', 'Export your day\'s dispositions. Count how many have next-step dates. 100% or fix them now.'),
  E('x20', 'compliance', 'List every place our SEBI registration number must appear. Check each one live. Report gaps.'),
  E('x21', 'sales', 'Rewrite your close in exactly 40 words: price, what they get, the next step. Recite from memory at huddle.'),
  E('x22', 'leadership', 'Sales Head: write tomorrow\'s huddle in 5 lines before leaving. Yesterday\'s number, today\'s target, one focus.'),
  E('x23', 'product', 'Take the P1 course module you know least. Watch it tonight. One insight to share at huddle.'),
  E('x24', 'systems', 'Check your callback queue for tomorrow before leaving. Every A-grade lead has a time slot. Screenshot it.'),
  E('x25', 'compliance', 'Write the difference between Scanner Lite and Scanner Pro in 3 sentences a regulator would accept.'),
  E('x26', 'sales', 'Objection ladder: "sochke batata hoon." Write 3 next lines that respect the customer and keep the door open.'),
  E('x27', 'marketing', 'Pick our worst-CPL creative. Write why in one line, and one variant that fixes only that.'),
  E('x28', 'review', 'Mid-sprint retro: each desk writes the one process change that would add the most revenue in 7 days.'),
  E('x29', 'product', 'Price recall drill: every product, price, and what GST-inclusive means for the customer. 100% or repeat tomorrow.'),
  E('x30', 'leadership', 'Write the note you would send a rep who mis-sold to hit target. Then the note for the rep who missed target honestly.'),
  E('x31', 'sales', 'Tone drill: record the same opening in 3 tones (energetic, calm-expert, friendly). TL picks which converts for you.'),
  E('x32', 'systems', 'Lead recycling check: how many day-21 leads re-entered cadence this week? Pull the number, report it.'),
  E('x33', 'compliance', 'KYC drill: list the 3 documents a Scanner Pro client must complete before access. Who checks each?'),
  E('x34', 'marketing', 'Write one organic post that teaches something real in under 100 words. No CTA. Trust is the CTA.'),
  E('x35', 'product', 'A customer asks: "Course lene ke baad kya main trading se kama lunga?" Write the honest, compliant answer.'),
  E('x36', 'sales', 'Discovery drill: write 5 questions that reveal capital band without asking "how much money do you have?"'),
  E('x37', 'leadership', 'TLs: score your own huddle this morning /10 on energy, clarity, number-focus. What gets +1 tomorrow?'),
  E('x38', 'systems', 'WhatsApp opt-in audit: check 10 recent leads for consent records. Report the count that would survive a DPDP query.'),
  E('x39', 'compliance', 'Refund maths: annual research subscription cancelled at month 5 — compute the exact refund. Show workings.'),
  E('x40', 'sales', 'The 12-minute drill: run a full P1 pitch against the clock with a partner. Where did minutes leak?'),
  E('x41', 'marketing', 'Hook autopsy: our best CTR hook — why does it work? Write the principle, then 3 new hooks from that principle.'),
  E('x42', 'review', 'Function heads: one metric you stopped looking at that you shouldn\'t have. Re-add it to your EOD tomorrow.'),
  E('x43', 'product', 'Workshop pitch: in 60 seconds, why is one day offline worth ₹9,999? Record and self-score credibility.'),
  E('x44', 'systems', 'Dial your own funnel: submit a lead on our form with a test number. Time every step to first call. Report leaks.'),
  E('x45', 'compliance', 'Call-recording disclosure: write the exact line we say, and check 5 of your calls actually said it.'),
  E('x46', 'sales', 'Warm-base drill (Desk B): pick 10 aged buyers, write one personalised opener each — reference their course progress.'),
  E('x47', 'leadership', 'Succession: each TL names who could cover them for 3 days, and the one thing that person can\'t yet do.'),
  E('x48', 'marketing', 'Language check: rewrite our top ad in simpler Hindi. Would your mother understand every word?'),
  E('x49', 'product', 'Scanner demo drill: set up one user-defined screen live in under 3 minutes. Time each other.'),
  E('x50', 'systems', 'CRM hygiene sprint: 15 minutes, clean every stale open deal older than 14 days. Close, recycle, or date it.'),
  E('x51', 'compliance', 'Grievance clock: if a SCORES complaint lands today, list the steps and deadlines to resolution. From memory, then verify.'),
  E('x52', 'sales', 'Silence drill: after stating price, practice 5 seconds of silence with a partner. Who speaks first loses the drill.'),
  E('x53', 'marketing', 'Creative fatigue check: which live ad has run longest? Pull its CPL trend. Refresh or defend it in one line.'),
  E('x54', 'review', 'Pre-WBR: each function drafts its Monday one-pager tonight. Numbers first, adjectives never.'),
  E('x55', 'product', 'Mentorship qualifier: write the 3 criteria a P1 buyer must meet before we offer the ₹74,999 cohort.'),
  E('x56', 'systems', 'Backup drill: export the day\'s data, restore it in a fresh browser, verify the number matches. Report result.'),
  E('x57', 'compliance', 'AI register check: list every agent that touched client-facing output this week. Is each one\'s human gate logged?'),
  E('x58', 'sales', 'Referral ask drill: write your natural-sounding referral ask for the moment after a customer says thank you.'),
  E('x59', 'leadership', 'The mirror: leaders write the one behaviour of theirs the floor copies that they wish it didn\'t.'),
  E('x60', 'review', 'Day-60 rehearsal: each function writes its final-report headline now — then works backward to make it true.'),
]

// ---------- Discovery questionnaire (Section 14) ----------

export interface DiscoveryQ { id: string; group: string; q: string; hint?: string; configPath?: string }
export const DISCOVERY_QS: DiscoveryQ[] = [
  { id: 'q1', group: 'Identity & legal', q: 'Exact legal entity name, CIN, and SEBI RA registration number. Is the trading brand different from the legal name?', hint: 'Update Entity in Config once confirmed', configPath: 'entity' },
  { id: 'q2', group: 'Identity & legal', q: 'Is a Compliance Officer appointed? Are client agreements, KYC and risk profiling operational today?' },
  { id: 'q3', group: 'Identity & legal', q: 'Is the registration individual or non-individual? Is a Principal Officer appointed?' },
  { id: 'q4', group: 'Current position', q: 'Exact collections for each of the last three months — growing, flat or declining?', hint: 'Sets the W1 run-rate in the pacing plan' },
  { id: 'q5', group: 'Current position', q: 'Exactly how many closers, tenure of each, best vs worst monthly revenue, and which two could move to Desk B this month?', hint: 'Edit the roster in Sales Command' },
  { id: 'q6', group: 'Current position', q: 'Current lead volume/month, current CPL, current lead-to-sale conversion?', hint: 'Overwrite funnel defaults in Config' },
  { id: 'q7', group: 'Current position', q: 'Current cash position and deployable working capital?', hint: 'Config → Cash' },
  { id: 'q8', group: 'Products', q: 'Are signals today generated automatically or by an analyst? Is an analyst\'s name attached? Any broker-execution connection?', hint: 'Determines Scanner Pro launch gating and the algo-framework question for the CO' },
  { id: 'q9', group: 'Products', q: 'Which products exist and are sellable today? Is the P1 course recorded and deliverable this week?' },
  { id: 'q10', group: 'Products', q: 'Is ₹25,00,000 gross collections including GST, or net revenue?', hint: 'Config → Target basis', configPath: 'target.basis' },
  { id: 'q11', group: 'Marketing', q: 'Which ad accounts are currently blocked, on which platforms, and what reason was given?' },
  { id: 'q12', group: 'Marketing', q: 'Meta SEBI advertiser verification and Google India financial-services verification — completed? SI Portal contacts registered and matching?', hint: 'Track in Lead Engine → Channel health' },
  { id: 'q13', group: 'Marketing', q: 'Existing organic footprint — YouTube subs, Telegram/WhatsApp list, email list?' },
  { id: 'q14', group: 'Operations', q: 'Current CRM, dialler, payment gateway and WhatsApp API?' },
  { id: 'q15', group: 'Operations', q: 'How many people use this dashboard, in which roles? Who is admin?' },
  { id: 'q16', group: 'Operations', q: 'Will this dashboard hold client PII or aggregates only?', hint: 'Strong recommendation: aggregates only — PII belongs in the CRM. OPERATOR is built for family/client codes, never names.' },
]
