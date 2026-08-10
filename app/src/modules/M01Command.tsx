import React, { useMemo } from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, Progress } from '../components/ui'
import { PaceChart, Spark } from '../components/charts'
import { inr, inrC, pct, num, todayISO, addDays, isSunday, fmtDateFull } from '../lib/format'
import { pacing, sprintCal, channelRisk, collectionsOf, forecastSprint, solveFunnel, sprintWeekOf } from '../model/engine'
import { monteCarlo } from '../model/monteCarlo'

export default function M01({ go }: { go: (m: string) => void }) {
  const { cfg, data } = useStore()
  const today = todayISO()
  const cal = useMemo(() => sprintCal(cfg, today), [cfg, today])
  const pace = useMemo(() => pacing(cfg, data, today), [cfg, data, today])
  const mc = useMemo(() => monteCarlo(cfg, data.reps), [cfg, data.reps])
  const fc = useMemo(() => forecastSprint(cfg, data.reps), [cfg, data.reps])

  const week = Math.min(sprintWeekOf(cfg, cal.today), cfg.target.runRatePlanWeekly.length)
  const weekPlan = cfg.target.runRatePlanWeekly[week - 1]
  const solved = useMemo(() => solveFunnel(cfg, weekPlan), [cfg, weekPlan])

  // Trailing 10 working days of collections for the spark
  const trail = useMemo(() => {
    const out: number[] = []
    for (let d = cal.today, n = 0; n < 10 && d >= cal.start; d = addDays(d, -1)) {
      if (isSunday(d)) continue
      out.unshift(collectionsOf(data.daily[d])); n++
    }
    return out
  }, [data.daily, cal])

  const risks = useMemo(() => {
    const out: { level: 'crit' | 'serious' | 'warn'; text: string; module: string }[] = []
    for (const h of data.channelHealth) {
      const r = channelRisk(h)
      const ch = cfg.channels.find(c => c.id === h.channelId)?.name ?? h.channelId
      if (r.band === 'critical' || r.band === 'high') out.push({ level: r.band === 'critical' ? 'crit' : 'serious', text: `${ch} ad account at ${r.band} risk (${r.score}/100) — verification and SI-portal match are the fix, not new accounts.`, module: 'm5' })
    }
    if (pace.variance < -0.15 * Math.max(1, pace.requiredCumToday)) out.push({ level: 'crit', text: `Collections ${inrC(-pace.variance)} behind the pace line — required per remaining working day is now ${inrC(pace.requiredPerRemainingWD)}.`, module: 'm12' })
    const plannedNotJoined = data.reps.filter(r => r.planned && r.joinDate <= cal.today).length
    if (plannedNotJoined > 0) out.push({ level: 'serious', text: `${plannedNotJoined} planned hire(s) past their join date and not on the floor — the forecast assumes them. Hiring slippage is the #1 killer of the 60-day date.`, module: 'm7' })
    const awaiting = data.signals.filter(s => s.status === 'awaiting_signoff').length
    if (awaiting) out.push({ level: 'serious', text: `${awaiting} signal batch(es) parked at analyst sign-off — clients receive nothing until a registered analyst signs.`, module: 'm9' })
    const capBreaches = data.families.filter(f => {
      const used = f.charges.filter(c => cfg.products.find(p => p.id === c.productId)?.countsTowardCap).reduce((s, c) => s + c.amountInclGst / (1 + cfg.target.gstRate), 0)
      return used > cfg.feeCap.capPerFamilyYear
    }).length
    if (capBreaches) out.push({ level: 'crit', text: `${capBreaches} family ledger(s) over the ₹1,51,000 cap — stop billing, involve the Compliance Officer today.`, module: 'm9' })
    const overdue = data.grievances.filter(g => g.status === 'open' && g.dueAt <= today).length
    if (overdue) out.push({ level: 'crit', text: `${overdue} grievance(s) past due — regulatory clocks are running.`, module: 'm9' })
    if (!out.length) out.push({ level: 'warn', text: 'No red flags on the board. The risk now is complacency — check the pace line at 13:00.', module: 'm12' })
    return out.slice(0, 3)
  }, [data, cfg, pace, cal, today])

  const action = useMemo(() => {
    if (risks[0]?.level === 'crit') return risks[0].text
    const yday = addDays(cal.today, -1)
    const ylog = data.daily[yday]
    if (!ylog && cal.dayIndex > 1) return `Yesterday (${yday}) has no EOD log. Numbers first: submit it in Daily Ritual, then run today against ${inrC(pace.requiredPerRemainingWD)}.`
    if (mc.pHit < 0.35) return `P(₹25L by Day 60) is ${pct(mc.pHit, 0)}. The two dates that move it most: ad-account verification and Cohort 1 joining. Check both are inside Week 1.`
    return `Hold the line: ${inrC(pace.requiredPerRemainingWD)} per working day, speed-to-lead under ${cfg.funnel.speedToLeadTargetMin} minutes, and every function's EOD in by 19:00.`
  }, [risks, cal, data.daily, mc.pHit, pace, cfg])

  const gstNote = cfg.target.basis === 'net'
    ? `Target read as net of GST — gross needed ≈ ${inrC(cfg.target.monthlyRunRate * (1 + cfg.target.gstRate))}`
    : `Target read as gross collections incl. GST (net ≈ ${inrC(cfg.target.monthlyRunRate / (1 + cfg.target.gstRate))})`

  return (
    <div className="grid">
      <Panel span={12} className="noprint">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <Stat label="North star" value={<span>{inrC(pace.targetRunRateEff)}<span className="dim" style={{ fontSize: 14 }}> /month by Day 60</span></span>} hero />
          </div>
          <Stat label="Sprint day" value={<span>D{cal.dayIndex}<span className="dim" style={{ fontSize: 15 }}> of {cal.days}</span></span>}
            sub={`${fmtDateFull(cal.today)} · week ${cal.weekIndex} · ${cal.workingDaysLeft} working days left`} />
          <Stat label="P(hit target)" value={pct(mc.pHit, 0)} tone={mc.pHit >= 0.5 ? 'good' : undefined}
            sub={`Monte Carlo, ${num(mc.runs)} runs · P50 lands ${inrC(mc.p50)}/mo`} />
        </div>
      </Panel>

      <Panel span={8} title="Burn-up — cumulative collections vs required pace">
        <PaceChart data={pace.curve.map(p => ({ day: p.day, required: Math.round(p.required), actual: p.actual == null ? null : Math.round(p.actual) }))} />
        <div className="row small dim" style={{ marginTop: 6, justifyContent: 'space-between' }}>
          <span>Plan integrates the weekly run-rate ramp (W1 {inrC(cfg.target.runRatePlanWeekly[0])}/mo → W9 {inrC(cfg.target.runRatePlanWeekly.at(-1)!)}/mo); sprint plan total {inrC(pace.plannedSprintTotal)}.</span>
          <span>{gstNote}</span>
        </div>
      </Panel>

      <Panel span={4} title="The number that runs today">
        <div className="stack">
          <Stat label="₹ per remaining working day" value={inr(Math.round(pace.requiredPerRemainingWD))} hero
            tone={pace.variance >= 0 ? 'good' : 'bad'}
            sub={pace.variance >= 0 ? `${inrC(pace.variance)} ahead of the line` : `${inrC(-pace.variance)} behind the line — this number rises every day you slip`} />
          <div>
            <div className="lbl" style={{ marginBottom: 3 }}>Cumulative — actual vs required</div>
            <Progress value={pace.requiredCumToday > 0 ? pace.actualCumToday / pace.requiredCumToday : 0} tone={pace.variance >= 0 ? 'g' : 'c'} />
            <div className="row small mono dim" style={{ justifyContent: 'space-between', marginTop: 3 }}>
              <span>{inrC(pace.actualCumToday)}</span><span>req {inrC(pace.requiredCumToday)}</span>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <Stat label="Current run-rate" value={inrC(pace.currentRunRate)} sub="trailing 7 working days" />
            <Spark values={trail} good={pace.variance >= 0} />
          </div>
          <div className="row small" style={{ justifyContent: 'space-between' }}>
            <span className="dim">Forecast Day-60 run-rate (deterministic)</span>
            <strong className="mono">{inrC(fc.day60RunRate)}</strong>
          </div>
        </div>
      </Panel>

      <Panel span={7} title="Top risks on the board">
        <div className="stack">
          {risks.map((r, i) => (
            <button key={i} className="note noprint" onClick={() => go(r.module)}
              style={{ borderColor: `var(--s-${r.level === 'warn' ? 'warn' : r.level === 'serious' ? 'serious' : 'crit'})`, cursor: 'pointer', textAlign: 'left', background: 'var(--panel2)' }}>
              <span className="row" style={{ gap: 7 }}>
                <AlertTriangle size={14} style={{ color: `var(--s-${r.level === 'warn' ? 'warn' : r.level === 'serious' ? 'serious' : 'crit'})`, flex: 'none', marginTop: 2 }} />
                <span>{r.text}</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', flex: 'none', opacity: .6 }} />
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel span={5} title="Today's single most important action">
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{action}</p>
        <hr className="hr" />
        <div className="kv">
          <dt>This week's run-rate plan</dt><dd>{inrC(weekPlan)}/mo</dd>
          <dt>Leads needed / day</dt><dd>{num(solved.leadsDaily, 0)}</dd>
          <dt>Dials needed / day</dt><dd>{num(solved.dialsDaily, 0)}</dd>
          <dt>Closers (ramped-equiv)</dt><dd>A {solved.closersA.toFixed(1)} · B {solved.closersB.toFixed(1)}</dd>
        </div>
        <hr className="hr" />
        <div className="row">
          <Pill kind={mc.pHit >= 0.5 ? 'good' : mc.pHit >= 0.25 ? 'warn' : 'crit'}>P(target) {pct(mc.pHit, 0)}</Pill>
          <Pill kind="acc">P50 {inrC(mc.p50)}/mo</Pill>
          <Pill kind="plain">P10 {inrC(mc.p10)} · P90 {inrC(mc.p90)}</Pill>
        </div>
        <p className="small dim" style={{ marginBottom: 0 }}>
          The plan is identical whether ₹25L lands on Day 60 or Day 85 — only the date on the wall changes. A team that fakes the date usually mis-sold to hit it; in a regulated business that trade is never worth it.
        </p>
      </Panel>
    </div>
  )
}
