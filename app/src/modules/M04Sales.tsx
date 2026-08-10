import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Num, Text, Select, Modal, Progress } from '../components/ui'
import { inr, inrC, num, pct, todayISO, uid, addDays, isSunday } from '../lib/format'
import { rampPct, sprintCal } from '../model/engine'
import type { Rep } from '../model/types'

export default function M04() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const cal = sprintCal(cfg, today)
  const [adding, setAdding] = useState(false)
  const [nr, setNr] = useState<{ name: string; desk: 'A' | 'B'; joinDate: string; planned: boolean }>({ name: '', desk: 'A', joinDate: today, planned: false })

  // Aggregate per rep over the sprint
  const perf = useMemo(() => {
    const logs = Object.values(data.daily).filter(l => l.date >= cal.start && l.date <= cal.end)
    return data.reps.map(rep => {
      let dials = 0, connects = 0, quals = 0, sales = 0, revenue = 0, days = 0, qaSum = 0, qaN = 0
      for (const l of logs) {
        const r = l.reps[rep.id]
        if (!r) continue
        dials += r.dials; connects += r.connects; quals += r.quals; sales += r.sales; revenue += r.revenue; days++
        if (r.qaScore != null) { qaSum += r.qaScore; qaN++ }
      }
      const weeks = Math.max(1, Math.floor((new Date(today).getTime() - new Date(rep.joinDate).getTime()) / (7 * 86400000)) + 1)
      const ramp = rep.planned && rep.joinDate > today ? 0 : rampPct(cfg, weeks)
      return { rep, dials, connects, quals, sales, revenue, days, qa: qaN ? qaSum / qaN : null, ramp, conv: quals > 0 ? sales / quals : null }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [data, cfg, cal, today])

  const floor = perf.filter(p => !p.rep.planned || p.rep.joinDate <= today)
  const totalRev = perf.reduce((s, p) => s + p.revenue, 0)
  const active = data.reps.filter(r => r.active && (!r.planned || r.joinDate <= today))

  const add = () => {
    if (!nr.name.trim()) return
    const rep: Rep = { id: uid('rep'), name: nr.name.trim(), desk: nr.desk, joinDate: nr.joinDate, active: true, planned: nr.planned }
    setData(d => ({ ...d, reps: [...d.reps, rep] }))
    setAdding(false); setNr({ name: '', desk: 'A', joinDate: today, planned: false })
  }

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="On the floor" value={`${active.filter(r => r.desk === 'A').length}A + ${active.filter(r => r.desk === 'B').length}B`} sub={`${data.reps.filter(r => r.planned && r.joinDate > today).length} planned joins ahead`} />
            <Stat label="Sprint revenue (rep-attributed)" value={inrC(totalRev)} sub="from daily rep logs" />
            <Stat label="Per-head benchmark" value={inr(185000)} sub="required ramped monthly output — the ₹85k/head gap is the real problem" />
          </div>
          <button className="btn primary noprint" onClick={() => setAdding(true)}><Plus size={14} /> Add rep / planned hire</button>
        </div>
      </Panel>

      <Panel span={12} title="Rep scorecard — sprint to date">
        <DataTable
          csvName="rep_scorecard"
          cols={[
            { h: '#', render: (_r, i) => <span className="mono faint">{i + 1}</span> },
            { h: 'Rep', render: r => <span><strong>{r.rep.name}</strong>{r.rep.planned && r.rep.joinDate > today && <span className="faint small"> · joins {r.rep.joinDate}</span>}{!r.rep.active && <span className="faint small"> · inactive</span>}</span>, csv: r => r.rep.name },
            { h: 'Desk', render: r => <Pill kind={r.rep.desk === 'A' ? 'acc' : 'plain'}>{r.rep.desk}</Pill>, csv: r => r.rep.desk },
            { h: 'Ramp', render: r => <div style={{ minWidth: 80 }}><Progress value={r.ramp / 100} tone={r.ramp >= 90 ? 'g' : undefined} /><span className="small mono dim">{r.ramp}%</span></div>, csv: r => r.ramp },
            { h: 'Dials', num: true, render: r => num(r.dials), csv: r => r.dials },
            { h: 'Connect%', num: true, render: r => (r.dials ? pct(r.connects / r.dials, 0) : '—'), csv: r => r.dials ? (r.connects / r.dials).toFixed(3) : '' },
            { h: 'Quals', num: true, render: r => num(r.quals), csv: r => r.quals },
            { h: 'Sales', num: true, render: r => num(r.sales), csv: r => r.sales },
            { h: 'Qual→sale', num: true, render: r => (r.conv != null ? pct(r.conv, 0) : '—'), csv: r => r.conv?.toFixed(3) ?? '' },
            { h: 'Revenue', num: true, render: r => inr(Math.round(r.revenue)), csv: r => Math.round(r.revenue) },
            { h: 'QA', num: true, render: r => (r.qa != null ? num(r.qa, 1) : '—'), csv: r => r.qa?.toFixed(1) ?? '' },
            {
              h: '', render: r => (
                <button className="btn sm noprint" onClick={() => setData(d => ({ ...d, reps: d.reps.map(x => x.id === r.rep.id ? { ...x, active: !x.active } : x) }))}>
                  {r.rep.active ? 'Deactivate' : 'Activate'}
                </button>
              ),
            },
          ]}
          rows={perf}
          empty="Add reps, then log per-rep numbers in the Daily Ritual EOD form."
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>Ramp expectation: {cfg.ramp.curveByWeek.join('% → ')}% by week since join. A rep two weeks below their line is a training problem this week and an attrition risk next week — the 1:1 happens now, not at month-end.</p>
      </Panel>

      <Panel span={6} title="Desk A — the maths of one ramped closer">
        <div className="kv">
          <dt>Dials/day</dt><dd>{cfg.desks.A.dialsPerDayRamped} (month 1: {cfg.desks.A.dialsPerDayM1})</dd>
          <dt>P1 sales/day</dt><dd>{cfg.desks.A.p1PerDayRamped} (month 1: {cfg.desks.A.p1PerDayM1})</dd>
          <dt>P1 sales/month</dt><dd>{Math.round(cfg.desks.A.p1PerDayRamped * cfg.target.workingDaysPerMonth)}</dd>
          <dt>Revenue/month</dt><dd>≈ {inrC(cfg.desks.A.p1PerDayRamped * cfg.target.workingDaysPerMonth * 2124 + 25 * 400)}</dd>
          <dt>Comp</dt><dd>{inr(cfg.comp.deskAFixed)} + ₹{cfg.comp.deskAPerP1}/P1 + ₹{cfg.comp.deskAPerScannerAnnual}/scanner-yr</dd>
        </div>
      </Panel>
      <Panel span={6} title="Desk B — the maths of one value closer">
        <div className="kv">
          <dt>Dials/day (warm)</dt><dd>{cfg.desks.B.dialsPerDayRamped}</dd>
          <dt>P3 sales/month</dt><dd>{cfg.desks.B.p3PerMonth}</dd>
          <dt>Workshop seats/month</dt><dd>{cfg.desks.B.p4aPerMonth}</dd>
          <dt>Revenue/month</dt><dd>≈ {inrC(cfg.desks.B.revenuePerMonth)}</dd>
          <dt>Comp</dt><dd>{inr(cfg.comp.deskBFixed)} + {pct(cfg.comp.deskBPctP3P4, 0)} of P3/P4 collections</dd>
        </div>
        <p className="small dim" style={{ marginBottom: 0 }}>Desk B sells only to buyers aged 30–90 days. It is the half of the target that does not exist today — open it before hiring anyone new for Desk A.</p>
      </Panel>

      {adding && (
        <Modal title="Add rep or planned hire" onClose={() => setAdding(false)}>
          <div className="stack">
            <Text label="Name" value={nr.name} onChange={v => setNr(s => ({ ...s, name: v }))} placeholder="Name (or 'Cohort 4 — A1 (planned)')" />
            <div className="formrow">
              <Select label="Desk" value={nr.desk} onChange={v => setNr(s => ({ ...s, desk: v as 'A' | 'B' }))} options={[['A', 'A — acquisition'], ['B', 'B — value / warm base']]} />
              <Text label="Join date" value={nr.joinDate} onChange={v => setNr(s => ({ ...s, joinDate: v }))} placeholder="YYYY-MM-DD" />
            </div>
            <label className="check"><input type="checkbox" checked={nr.planned} onChange={e => setNr(s => ({ ...s, planned: e.target.checked }))} /> Planned hire (future join — feeds the forecast, not the floor)</label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn primary" onClick={add}>Add</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
