import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { Panel, Stat, Tabs, Num, DataTable, Pill, Text, useFlash, type Col } from '../components/ui'
import { McHistogram, SeriesBars } from '../components/charts'
import { inr, inrC, num, pct, uid } from '../lib/format'
import { anchorName, blendedAovP1, forecastSprint, netLeadToSale, planRevenueMonthly, sensitivity, solveFunnel } from '../model/engine'
import { monteCarlo } from '../model/monteCarlo'
import type { Scenario } from '../model/types'

export default function M02() {
  const [tab, setTab] = useState('solver')
  return (
    <div className="grid">
      <Panel span={12}>
        <Tabs on={tab} set={setTab} tabs={[['solver', 'Reverse solver'], ['sens', 'Sensitivity'], ['mc', 'Monte Carlo'], ['scen', 'Scenarios']]} />
        {tab === 'solver' && <Solver />}
        {tab === 'sens' && <Sens />}
        {tab === 'mc' && <Mc />}
        {tab === 'scen' && <Scenarios />}
      </Panel>
    </div>
  )
}

function Solver() {
  const { cfg, setCfg } = useStore()
  const [target, setTarget] = useState(cfg.target.monthlyRunRate)
  const s = useMemo(() => solveFunnel(cfg, target), [cfg, target])
  const plan = planRevenueMonthly(cfg)
  const f = cfg.funnel

  const rows = cfg.products.map(p => ({
    p, units: s.unitsMonthly[p.id], revenue: s.unitsMonthly[p.id] * p.priceInclGst,
  }))

  const cols: Col<(typeof rows)[number]>[] = [
    { h: 'Product', render: r => <span>{r.p.short} <span className="faint small">· {r.p.desk} · {r.p.regClass}</span></span>, csv: r => r.p.name },
    { h: 'Price', num: true, render: r => inr(r.p.priceInclGst), csv: r => r.p.priceInclGst },
    { h: 'Units/mo', num: true, render: r => num(r.units, 1), csv: r => r.units.toFixed(1) },
    { h: 'Units/day', num: true, render: r => num(r.units / cfg.target.workingDaysPerMonth, 2), csv: r => (r.units / cfg.target.workingDaysPerMonth).toFixed(2) },
    { h: 'Revenue/mo', num: true, render: r => inr(Math.round(r.revenue)), csv: r => Math.round(r.revenue) },
  ]

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="c12 row" style={{ alignItems: 'flex-end' }}>
        <Num label="Target monthly collections" value={target} onChange={setTarget} step={100000} width={190} />
        <div className="row" style={{ gap: 18, marginLeft: 8 }}>
          <Stat label="Leads / month" value={num(s.leadsMonthly, 0)} sub={`${num(s.leadsDaily, 0)}/day`} />
          <Stat label="Ad spend / month" value={inrC(s.adSpendMonthly)} sub={`paid share ${pct(f.paidLeadShare, 0)} @ CPL ₹${f.cplBlended}`} />
          <Stat label="Closers needed" value={`${Math.ceil(s.closersA)}A + ${Math.ceil(s.closersB)}B`} sub="ramped equivalents" />
          <Stat label="Net lead→sale" value={pct(s.net, 2)} sub={`${pct(f.connectRate, 0)} × ${pct(f.qualRate, 0)} × ${pct(f.closeRate, 0)}`} />
        </div>
      </div>
      <div className="c12">
        <div className="lbl" style={{ marginBottom: 6 }}>Assumptions — edit here, the whole model recalculates (persists to Config)</div>
        <div className="formrow">
          <Num label="Connect rate" value={f.connectRate} step={0.01} onChange={v => setCfg(c => ({ ...c, funnel: { ...c.funnel, connectRate: v } }))} />
          <Num label="Qualified rate" value={f.qualRate} step={0.01} onChange={v => setCfg(c => ({ ...c, funnel: { ...c.funnel, qualRate: v } }))} />
          <Num label="Close rate" value={f.closeRate} step={0.005} onChange={v => setCfg(c => ({ ...c, funnel: { ...c.funnel, closeRate: v } }))} />
          <Num label="Blended CPL ₹" value={f.cplBlended} step={5} onChange={v => setCfg(c => ({ ...c, funnel: { ...c.funnel, cplBlended: v } }))} />
          <Num label="Paid lead share" value={f.paidLeadShare} step={0.05} onChange={v => setCfg(c => ({ ...c, funnel: { ...c.funnel, paidLeadShare: v } }))} />
          <Num label="Bump take rate" value={f.bumpTakeRate} step={0.05} onChange={v => setCfg(c => ({ ...c, funnel: { ...c.funnel, bumpTakeRate: v } }))} />
        </div>
        <p className="small dim">Blended {anchorName(cfg)} AOV {inr(blendedAovP1(cfg))} · plan mix held constant at {inrC(plan.total)}/mo (Desk A {inrC(plan.deskA)} · Desk B {inrC(plan.deskB)}). Lifting net lead→sale from {pct(netLeadToSale(cfg), 2)} to 4.5% cuts the lead bill by ≈ {inrC(Math.max(0, (s.leadsMonthly - (s.p1Units / 0.045)) * f.paidLeadShare * f.cplBlended))}/month.</p>
      </div>
      <div className="c12">
        <DataTable cols={cols} rows={rows} csvName="solver_mix"
          sumRow={['Total', '', num(rows.reduce((x, r) => x + r.units, 0), 0), '', inr(Math.round(rows.reduce((x, r) => x + r.revenue, 0)))]} />
      </div>
    </div>
  )
}

function Sens() {
  const { cfg, data } = useStore()
  const s = useMemo(() => sensitivity(cfg, data.reps), [cfg, data.reps])
  return (
    <div className="stack">
      <div className="row">
        <Stat label="Base Day-60 run-rate" value={inrC(s.base.day60RunRate)} sub={`sprint total ${inrC(s.base.sprintTotal)} · month 1 ${inrC(s.base.month1)}`} />
        <Pill kind={s.base.hitsTarget ? 'good' : 'warn'}>{s.base.hitsTarget ? 'base case reaches target' : 'base case lands short — see Monte Carlo for the distribution'}</Pill>
      </div>
      <div className="twrap">
        <table className="t">
          <thead><tr><th>Lever</th><th className="num">−20%</th><th className="num">−10%</th><th className="num">+10%</th><th className="num">+20%</th></tr></thead>
          <tbody>
            {s.rows.map(r => (
              <tr key={r.kind}>
                <td>{r.lever}{r.kind === 'cplMult' && <span className="faint small"> (higher = costlier)</span>}</td>
                {r.deltas.map(d => {
                  const good = d.day60 >= 0
                  return <td key={d.pct} className="num" style={{ color: d.day60 === 0 ? undefined : good ? 'var(--delta-good)' : 'var(--delta-bad)' }}>{inrC(d.day60, { sign: true })}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small dim" style={{ margin: 0 }}>Change in Day-60 monthly run-rate for a ±10% / ±20% move in each lever, all else held. Close rate and ramp speed dominate — they are floor-controlled and free; CPL buys the same gain with cash. That is why training and speed-to-lead come before spend.</p>
    </div>
  )
}

function Mc() {
  const { cfg, setCfg, data } = useStore()
  const mc = useMemo(() => monteCarlo(cfg, data.reps), [cfg, data.reps])
  const fcNoPlanned = useMemo(() => forecastSprint(cfg, data.reps, { includePlanned: false }), [cfg, data.reps])
  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="c12 row">
        <Stat label="P(≥ target at Day 60)" value={pct(mc.pHit, 0)} hero tone={mc.pHit >= 0.5 ? 'good' : undefined} sub={`${num(mc.runs)} simulated sprints`} />
        <Stat label="P10 / P50 / P90 run-rate" value={<span>{inrC(mc.p10)} / <strong>{inrC(mc.p50)}</strong> / {inrC(mc.p90)}</span>} sub="monthly run-rate at Day 60" />
        <Stat label="Sprint collections P50" value={inrC(mc.sprintP50)} sub={`P10 ${inrC(mc.sprintP10)} · P90 ${inrC(mc.sprintP90)}`} />
      </div>
      <div className="c12">
        <McHistogram bins={mc.histogram} target={mc.targetEff} p50={mc.p50} />
        <p className="small dim">Distribution of Day-60 monthly run-rate across simulated sprints. Sampled: close rate σ{pct(cfg.mc.sdClose, 0)}, CPL σ{pct(cfg.mc.sdCpl, 0)}, ramp σ{pct(cfg.mc.sdRamp, 0)}, AOV σ{pct(cfg.mc.sdAov, 0)}, organic volume, Desk-B yield, and hiring slippage (mean ≈ 3 days). Without the planned cohorts the ceiling is {inrC(fcNoPlanned.day60RunRate)}/mo — hiring is load-bearing, exactly as the coach's note says.</p>
      </div>
      <div className="c12 formrow">
        <Num label="Runs" value={cfg.mc.runs} step={1000} onChange={v => setCfg(c => ({ ...c, mc: { ...c.mc, runs: v } }))} />
        <Num label="σ close" value={cfg.mc.sdClose} step={0.01} onChange={v => setCfg(c => ({ ...c, mc: { ...c.mc, sdClose: v } }))} />
        <Num label="σ CPL" value={cfg.mc.sdCpl} step={0.01} onChange={v => setCfg(c => ({ ...c, mc: { ...c.mc, sdCpl: v } }))} />
        <Num label="σ ramp" value={cfg.mc.sdRamp} step={0.01} onChange={v => setCfg(c => ({ ...c, mc: { ...c.mc, sdRamp: v } }))} />
        <Num label="σ AOV" value={cfg.mc.sdAov} step={0.01} onChange={v => setCfg(c => ({ ...c, mc: { ...c.mc, sdAov: v } }))} />
        <Num label="Organic leads/mo" value={cfg.mc.organicLeadsMonthly} step={100} onChange={v => setCfg(c => ({ ...c, mc: { ...c.mc, organicLeadsMonthly: v } }))} />
      </div>
      <div className="c12">
        <div className="lbl" style={{ marginBottom: 6 }}>Deterministic weekly build-up (base case)</div>
        <WeeklyTable />
      </div>
    </div>
  )
}

function WeeklyTable() {
  const { cfg, data } = useStore()
  const fc = useMemo(() => forecastSprint(cfg, data.reps), [cfg, data.reps])
  const rows = fc.weeks
  return (
    <>
      <SeriesBars xKey="w" stacked height={190}
        data={rows.map(r => ({ w: `W${r.week}`, A: Math.round(r.revenueA), B: Math.round(r.revenueB) }))}
        series={[{ key: 'A', name: 'Desk A (acquisition)' }, { key: 'B', name: 'Desk B (warm base)' }]} />
      <DataTable
        csvName="weekly_forecast"
        cols={[
          { h: 'Week', render: (r: typeof rows[number]) => `W${r.week}`, csv: r => r.week },
          { h: 'Spend', num: true, render: r => inrC(r.spend), csv: r => Math.round(r.spend) },
          { h: 'Leads', num: true, render: r => num(r.leads, 0), csv: r => Math.round(r.leads) },
          { h: 'Demand', num: true, render: r => num(r.p1Demand, 0), csv: r => Math.round(r.p1Demand) },
          { h: 'Capacity', num: true, render: r => num(r.p1Capacity, 0), csv: r => Math.round(r.p1Capacity) },
          { h: 'Sales', num: true, render: r => <strong>{num(r.p1Sales, 0)}</strong>, csv: r => Math.round(r.p1Sales) },
          { h: 'Revenue', num: true, render: r => inrC(r.revenue), csv: r => Math.round(r.revenue) },
          { h: 'Run-rate', num: true, render: r => inrC(r.runRate), csv: r => Math.round(r.runRate) },
        ]}
        rows={rows}
      />
      <p className="small dim" style={{ margin: '6px 0 0' }}>Demand, capacity and sales are counted in {anchorName(cfg)} units. Sales = min(demand from leads, floor capacity). Where capacity binds, more spend is wasted; where demand binds, more hiring is wasted. The binding side is the week's true constraint.</p>
    </>
  )
}

function Scenarios() {
  const { cfg, setCfg, data, setData } = useStore()
  const [name, setName] = useState('')
  const [flash, setFlash] = useFlash()
  const save = () => {
    const mc = monteCarlo(cfg, data.reps)
    const sc: Scenario = {
      id: uid('scen'), name: name || `Scenario ${data.scenarios.length + 1}`, savedAt: new Date().toISOString(),
      overrides: { ...cfg.funnel }, p50: mc.p50, pHit: mc.pHit,
    }
    setData(d => ({ ...d, scenarios: [sc, ...d.scenarios] }))
    setName(''); setFlash('Scenario saved.')
  }
  return (
    <div className="stack">
      <div className="formrow">
        <Text label="Name this scenario (captures current funnel assumptions + results)" value={name} onChange={setName} placeholder="e.g. verified-ads + 4.2% close" />
        <button className="btn primary" onClick={save}>Save scenario</button>
        {flash && <Pill kind="good">{flash}</Pill>}
      </div>
      <DataTable
        empty="No saved scenarios. Save one before you change assumptions, so you can compare."
        cols={[
          { h: 'Scenario', render: (s: Scenario) => <strong>{s.name}</strong>, csv: s => s.name },
          { h: 'Close', num: true, render: s => pct(s.overrides.closeRate ?? 0, 1), csv: s => s.overrides.closeRate ?? '' },
          { h: 'CPL', num: true, render: s => `₹${s.overrides.cplBlended}`, csv: s => s.overrides.cplBlended ?? '' },
          { h: 'Connect', num: true, render: s => pct(s.overrides.connectRate ?? 0, 0), csv: s => s.overrides.connectRate ?? '' },
          { h: 'P50 run-rate', num: true, render: s => (s.p50 ? inrC(s.p50) : '—'), csv: s => s.p50 ?? '' },
          { h: 'P(target)', num: true, render: s => (s.pHit != null ? pct(s.pHit, 0) : '—'), csv: s => s.pHit ?? '' },
          {
            h: '', render: s => (
              <span className="row" style={{ gap: 6 }}>
                <button className="btn sm" onClick={() => setCfg(c => ({ ...c, funnel: { ...c.funnel, ...s.overrides } }))}>Load</button>
                <button className="btn sm danger" onClick={() => setData(d => ({ ...d, scenarios: d.scenarios.filter(x => x.id !== s.id) }))}>Delete</button>
              </span>
            ),
          },
        ]}
        rows={data.scenarios}
        csvName="scenarios"
      />
    </div>
  )
}
