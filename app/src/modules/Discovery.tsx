import React, { useMemo } from 'react'
import { Printer, CheckCircle2 } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Text, Pill, Progress } from '../components/ui'
import { inrC, num, pct } from '../lib/format'
import { DISCOVERY_QS } from '../model/content'
import { anchorName, blendedAovP1, netLeadToSale, planRevenueMonthly, solveFunnel } from '../model/engine'
import { monteCarlo } from '../model/monteCarlo'

export default function Discovery() {
  const { cfg, data, setData } = useStore()
  const answers = data.discovery.answers
  const answered = DISCOVERY_QS.filter(q => (answers[q.id] ?? '').trim().length > 0).length
  const groups = [...new Set(DISCOVERY_QS.map(q => q.group))]

  const set = (id: string, v: string) =>
    setData(d => ({ ...d, discovery: { ...d.discovery, answers: { ...d.discovery.answers, [id]: v } } }))
  const confirm = () =>
    setData(d => ({ ...d, discovery: { ...d.discovery, confirmed: true, confirmedAt: new Date().toISOString() } }))

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="Discovery — Section 14" value={`${answered}/${DISCOVERY_QS.length}`} sub="the brief's questions, asked here because this session is asynchronous — answer, then confirm the restated model" />
            <div style={{ minWidth: 180, alignSelf: 'center' }}><Progress value={answered / DISCOVERY_QS.length} tone={answered === DISCOVERY_QS.length ? 'g' : undefined} /></div>
          </div>
          <div className="row noprint">
            {data.discovery.confirmed
              ? <Pill kind="good">model confirmed {data.discovery.confirmedAt?.slice(0, 10)}</Pill>
              : <button className="btn primary" onClick={confirm} disabled={answered < DISCOVERY_QS.length}><CheckCircle2 size={14} /> Confirm the restated model</button>}
            <button className="btn" onClick={() => window.print()}><Printer size={14} /> Print one-pager</button>
          </div>
        </div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>
          OPERATOR launched with the brief's CEO defaults so nothing blocks — but the defaults are assumptions until these sixteen answers replace them. Where an answer changes a number, edit it in Config (hints below point to the exact field); the whole system recalculates live.
        </p>
      </Panel>

      {groups.map(g => (
        <Panel key={g} span={6} title={g}>
          <div className="stack">
            {DISCOVERY_QS.filter(q => q.group === g).map(q => (
              <div key={q.id}>
                <div className="small" style={{ marginBottom: 3 }}><strong className="mono faint">{q.id.toUpperCase()}</strong> {q.q}</div>
                <Text area value={answers[q.id] ?? ''} onChange={v => set(q.id, v)} placeholder="Answer…" />
                {q.hint && <div className="small faint" style={{ marginTop: 2 }}>→ {q.hint}</div>}
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <OnePager />
    </div>
  )
}

function OnePager() {
  const { cfg, data } = useStore()
  const plan = planRevenueMonthly(cfg)
  const solved = useMemo(() => solveFunnel(cfg, cfg.target.monthlyRunRate), [cfg])
  const mc = useMemo(() => monteCarlo(cfg, data.reps), [cfg, data.reps])
  const targetEff = cfg.target.basis === 'net' ? cfg.target.monthlyRunRate * (1 + cfg.target.gstRate) : cfg.target.monthlyRunRate

  return (
    <Panel span={12} title="The model, restated on one page (reflects current Config — print for sign-off)">
      <div className="grid" style={{ gap: 10 }}>
        <div className="c4 stack" style={{ gap: 4 }}>
          <div className="lbl">Who</div>
          <p className="small" style={{ margin: 0 }}>
            <strong>{cfg.entity.legalName}</strong> ({cfg.entity.brand}) — SEBI-registered Research Analyst {cfg.entity.sebiReg || '(no.?)'}·
            Registered office {cfg.entity.registeredOffice}; operations {cfg.entity.corporateOffice}.
            CO: {cfg.entity.complianceOfficer || 'unconfirmed'} · PO: {cfg.entity.principalOfficer || 'unconfirmed'} · CIN: {cfg.entity.cin || 'unconfirmed'}.
          </p>
          <div className="lbl" style={{ marginTop: 8 }}>The ask</div>
          <p className="small" style={{ margin: 0 }}>
            {inrC(targetEff)}/month in collections ({cfg.target.basis === 'gross' ? 'gross incl. GST' : 'net — grossed up'}) by Day {cfg.sprint.days} of the sprint starting {cfg.sprint.startDate}.
            From a W1 base of {inrC(cfg.target.runRatePlanWeekly[0])}/mo, that is ≈{(targetEff / Math.max(1, cfg.target.runRatePlanWeekly[0])).toFixed(1)}× in {Math.round(cfg.sprint.days / 7)} weeks.
          </p>
          <div className="lbl" style={{ marginTop: 8 }}>Honest odds (live Monte Carlo)</div>
          <p className="small" style={{ margin: 0 }}>
            P(hit by Day 60) ≈ <strong>{pct(mc.pHit, 0)}</strong>. P50 Day-60 run-rate {inrC(mc.p50)}; P10 {inrC(mc.p10)}, P90 {inrC(mc.p90)}.
            Build to the 60-day plan; treat a Day-85 landing as a win, not a failure. The two dates that decide it: ad-account verification and Cohort 1 joining — both inside Week 1.
          </p>
        </div>
        <div className="c4 stack" style={{ gap: 4 }}>
          <div className="lbl">The machine</div>
          <p className="small" style={{ margin: 0 }}>
            Two desks. <strong>Desk A</strong> closes the {inrC(cfg.products.find(p => p.id === 'p1')!.priceInclGst)} course on a single phone call (no webinar), attaches the bump and Scanner Lite — plan {inrC(plan.deskA)}/mo.
            <strong> Desk B</strong> works buyers aged 30–90 days into research, workshops and mentorship — plan {inrC(plan.deskB)}/mo. Half the target comes from people who already paid once.
          </p>
          <div className="lbl" style={{ marginTop: 8 }}>The funnel, solved backwards</div>
          <p className="small mono" style={{ margin: 0 }}>
            {inrC(cfg.target.monthlyRunRate)} → {num(solved.p1Units, 0)} {anchorName(cfg)} sales → {num(solved.leadsMonthly, 0)} leads/mo ({num(solved.leadsDaily, 0)}/day) @ net {pct(netLeadToSale(cfg), 2)} → spend {inrC(solved.adSpendMonthly)}/mo @ CPL ₹{cfg.funnel.cplBlended} · AOV {inrC(blendedAovP1(cfg))} · closers {Math.ceil(solved.closersA)}A+{Math.ceil(solved.closersB)}B
          </p>
          <div className="lbl" style={{ marginTop: 8 }}>Sequence</div>
          <p className="small" style={{ margin: 0 }}>
            Fix the machine (speed-to-lead ≤{cfg.funnel.speedToLeadTargetMin} min, ladder, verification) → open Desk B → hire cohorts into the Academy → ramp spend {cfg.spendRampMonthly.map(t => inrC(t.monthly)).join(' → ')} with collections, never ahead of them.
          </p>
        </div>
        <div className="c4 stack" style={{ gap: 4 }}>
          <div className="lbl">The guardrails (non-negotiable)</div>
          <p className="small" style={{ margin: 0 }}>
            1 · Every recommendation carries a registered analyst's logged sign-off — AI drafts, humans approve.<br />
            2 · No return claims anywhere — ads, scripts, testimonials.<br />
            3 · Every individual/HUF rupee checks the {inrC(cfg.feeCap.capPerFamilyYear)} family cap <em>before</em> the payment link exists; advances capped at {cfg.feeCap.advanceMaxMonths} months; refunds pro-rata, zero breakage.<br />
            4 · Calls recorded; weekly sampled audit.<br />
            5 · Education and research on separate brands, pages, ad accounts and books. Scanner Lite (user-defined screens) is a tool; Scanner Pro (entry/SL/target) is research with KYC + agreement + risk profile gating access.
          </p>
          <div className="lbl" style={{ marginTop: 8 }}>Cash</div>
          <p className="small" style={{ margin: 0 }}>
            Working capital {inrC(cfg.cash.workingCapitalAvailable)} deployed against an {inrC(1800000)}–{inrC(2200000)} requirement; Month-1 spends before Month-2 collects. Runway lives in Finance and alerts under {cfg.cash.runwayAlertDays} days.
          </p>
        </div>
      </div>
    </Panel>
  )
}
