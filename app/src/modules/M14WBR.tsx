import React, { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Text, Select, Pill } from '../components/ui'
import { inr, inrC, num, pct, todayISO, addDays, isSunday } from '../lib/format'
import { collectionsOf, sprintCal, sprintWeekOf } from '../model/engine'

export default function M14() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const cal = sprintCal(cfg, today)
  const currentWeek = sprintWeekOf(cfg, cal.today)
  const [week, setWeek] = useState(String(Math.max(1, currentWeek - (new Date().getDay() === 1 ? 1 : 0))))
  const w = parseInt(week)

  const range = useMemo(() => {
    const from = addDays(cfg.sprint.startDate, (w - 1) * 7)
    const to = addDays(from, 6)
    return { from, to: to > cal.end ? cal.end : to }
  }, [cfg.sprint.startDate, w, cal.end])

  const stats = useMemo(() => {
    let coll = 0, leads = 0, spend = 0, dials = 0, sales = 0, workDays = 0
    for (let d = range.from; d <= range.to; d = addDays(d, 1)) {
      const l = data.daily[d]
      if (!isSunday(d)) workDays++
      if (!l) continue
      coll += collectionsOf(l)
      leads += l.leadsIn
      spend += Object.values(l.spend).reduce<number>((s, v) => s + (v || 0), 0)
      dials += l.dials
      sales += Object.values(l.units).reduce<number>((s, v) => s + (v || 0), 0)
    }
    const planRun = cfg.target.runRatePlanWeekly[Math.min(w, cfg.target.runRatePlanWeekly.length) - 1]
    const planColl = planRun / cfg.target.workingDaysPerMonth * workDays
    return { coll, leads, spend, dials, sales, planColl, workDays, planRun }
  }, [data.daily, range, cfg, w])

  const key = `W${String(w).padStart(2, '0')}`
  const review = data.wbr[key] ?? { weekKey: key, wins: '', misses: '', decisions: '' }
  const upd = (patch: Partial<typeof review>) => setData(d => ({ ...d, wbr: { ...d.wbr, [key]: { ...review, ...patch } } }))

  const funnelRows = [
    { m: 'Collections', plan: inr(Math.round(stats.planColl)), actual: inr(Math.round(stats.coll)), ok: stats.coll >= stats.planColl * 0.9 },
    { m: 'Leads', plan: '—', actual: num(stats.leads), ok: true },
    { m: 'Dials', plan: '—', actual: num(stats.dials), ok: true },
    { m: 'Units sold', plan: '—', actual: num(stats.sales), ok: true },
    { m: 'Ad spend', plan: '—', actual: inr(Math.round(stats.spend)), ok: true },
    { m: 'CPL (blended)', plan: `₹${cfg.funnel.cplBlended}`, actual: stats.leads > 0 && stats.spend > 0 ? inr(Math.round(stats.spend / stats.leads)) : '—', ok: !(stats.leads > 0 && stats.spend > 0) || stats.spend / stats.leads <= cfg.funnel.cplBlended * 1.2 },
  ]

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <Select label="Sprint week" value={week} onChange={setWeek}
              options={Array.from({ length: Math.ceil(cfg.sprint.days / 7) }, (_, i) => [String(i + 1), `W${i + 1} (${addDays(cfg.sprint.startDate, i * 7)} →)`])} />
            <Stat label="Week window" value={`${range.from} → ${range.to}`} sub={`${stats.workDays} working days · plan run-rate ${inrC(stats.planRun)}/mo`} />
          </div>
          <div className="row noprint">
            {review.submittedAt ? <Pill kind="good">submitted {review.submittedAt.slice(0, 10)}</Pill> : <Pill kind="warn">draft</Pill>}
            <button className="btn" onClick={() => window.print()}><Printer size={14} /> Print pack</button>
            <button className="btn primary" onClick={() => upd({ submittedAt: new Date().toISOString() })}>Submit pack</button>
          </div>
        </div>
      </Panel>

      <Panel span={6} title={`${key} — plan vs actual`}>
        <DataTable
          csvName={`wbr_${key}`}
          cols={[
            { h: 'Metric', render: (r: typeof funnelRows[number]) => r.m, csv: r => r.m },
            { h: 'Plan', num: true, render: r => r.plan, csv: r => r.plan },
            { h: 'Actual', num: true, render: r => r.actual, csv: r => r.actual },
            { h: '', render: r => r.ok ? <Pill kind="good">ok</Pill> : <Pill kind="crit">miss</Pill> },
          ]}
          rows={funnelRows}
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>A week below 70% of its collections plan triggers the recovery playbook the same Sunday: fix the first broken rate (CPL → connect → close → AOV) — never scale spend into a broken rate.</p>
      </Panel>

      <Panel span={6} title="This week's targets (auto from the pacing plan)">
        <div className="kv">
          <dt>Next week run-rate plan</dt><dd>{inrC(cfg.target.runRatePlanWeekly[Math.min(w + 1, cfg.target.runRatePlanWeekly.length) - 1])}/mo</dd>
          <dt>Collections needed</dt><dd>{inrC(cfg.target.runRatePlanWeekly[Math.min(w + 1, cfg.target.runRatePlanWeekly.length) - 1] / cfg.target.workingDaysPerMonth * 6)} (6 working days)</dd>
          <dt>Sign-off queue</dt><dd>{data.signals.filter(s => s.status === 'awaiting_signoff').length} awaiting</dd>
          <dt>Hiring pipeline</dt><dd>{data.candidates.filter(c => !c.dropped && c.stage < 4).length} pre-join · {data.candidates.filter(c => !c.dropped && c.stage >= 4).length} joined</dd>
          <dt>Academy</dt><dd>{data.trainees.filter(t => t.certified === 'pending').length} in training · {data.trainees.filter(t => t.certified === 'passed').length} certified</dd>
        </div>
      </Panel>

      <Panel span={4} title="Wins"><Text area value={review.wins} onChange={v => upd({ wins: v })} placeholder="What worked — with the number that proves it" /></Panel>
      <Panel span={4} title="Misses"><Text area value={review.misses} onChange={v => upd({ misses: v })} placeholder="What missed — and the first broken rate behind it" /></Panel>
      <Panel span={4} title="Decisions needed from the CEO"><Text area value={review.decisions} onChange={v => upd({ decisions: v })} placeholder="Max 3. Options + recommendation each." /></Panel>
    </div>
  )
}
