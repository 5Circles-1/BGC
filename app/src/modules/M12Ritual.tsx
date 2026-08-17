import React, { useMemo, useState } from 'react'
import { Lock, CheckCircle2, ListTodo } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Text, Tabs, useFlash } from '../components/ui'
import { inr, inrC, num, todayISO, addDays, isSunday, fmtDateFull, uid } from '../lib/format'
import { collectionsOf, dayVariance, generateTasks, sprintCal } from '../model/engine'
import { EXERCISES, type Exercise } from '../model/content'
import { FN_LABEL } from '../model/defaults'
import type { DailyLog, Fn, ProductId } from '../model/types'

const emptyLog = (date: string): DailyLog => ({
  date, units: {}, collections: {}, leadsIn: 0, leadsBySource: {}, spend: {},
  dials: 0, connects: 0, quals: 0, speedToLeadMedianMin: null, reps: {}, notes: {}, eod: {}, locked: false,
})

export default function M12() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const cal = sprintCal(cfg, today)
  const [date, setDate] = useState(cal.today)
  const [tab, setTab] = useState('eod')
  const [flash, setFlash] = useFlash()

  const log = data.daily[date] ?? emptyLog(date)
  const upd = (patch: Partial<DailyLog>) => {
    if (log.locked) { setFlash('This day is locked. Unlock (Management) to edit — the unlock is audited.'); return }
    setData(d => ({ ...d, daily: { ...d.daily, [date]: { ...(d.daily[date] ?? emptyLog(date)), ...patch } } }))
  }
  const submitFn = (fn: Fn) => {
    setData(d => {
      const l = d.daily[date] ?? emptyLog(date)
      return { ...d, daily: { ...d.daily, [date]: { ...l, eod: { ...l.eod, [fn]: true } } } }
    })
    setFlash(`${FN_LABEL[fn]} EOD marked submitted for ${date}.`)
  }
  const lockDay = () => {
    setData(d => {
      const l = d.daily[date] ?? emptyLog(date)
      return {
        ...d,
        daily: { ...d.daily, [date]: { ...l, locked: !l.locked, lockedAt: new Date().toISOString() } },
        auditTrail: [...d.auditTrail, { at: new Date().toISOString(), what: `${l.locked ? 'UNLOCKED' : 'LOCKED'} daily log ${date}` }],
      }
    })
  }

  const total = collectionsOf(log)

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <label className="field" style={{ flex: '0 0 150px' }}>
              <span className="lbl">Log date</span>
              <input className="in mono" type="date" value={date} min={cal.start} max={cal.end} onChange={e => setDate(e.target.value || cal.today)} />
            </label>
            <Stat label="Day collections" value={inr(Math.round(total))} sub={isSunday(date) ? 'Sunday — off the working-day plan' : fmtDateFull(date)} />
            <div className="row" style={{ gap: 6 }}>
              {(['sales', 'marketing', 'operations', 'finance'] as Fn[]).map(fn => (
                <Pill key={fn} kind={log.eod[fn] ? 'good' : 'plain'}>{FN_LABEL[fn]}</Pill>
              ))}
            </div>
          </div>
          <div className="row noprint">
            {flash && <span className="small dim">{flash}</span>}
            <button className="btn" onClick={lockDay}><Lock size={13} /> {log.locked ? 'Unlock (audited)' : 'Lock day (19:30)'}</button>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Tabs on={tab} set={setTab} tabs={[['eod', '1 · EOD update'], ['var', '2 · Variance report'], ['tasks', '3 · Tomorrow\'s tasks'], ['ex', '4 · The day\'s exercise']]} />
          {tab === 'eod' && <EodForm log={log} upd={upd} submitFn={submitFn} locked={log.locked} />}
          {tab === 'var' && <VarianceView date={date} />}
          {tab === 'tasks' && <TasksView date={date} />}
          {tab === 'ex' && <ExerciseView date={date} />}
        </div>
      </Panel>
    </div>
  )
}

function EodForm({ log, upd, submitFn, locked }: { log: DailyLog; upd: (p: Partial<DailyLog>) => void; submitFn: (fn: Fn) => void; locked: boolean }) {
  const { cfg, data } = useStore()
  const numIn = (value: number | null, onChange: (v: number) => void, w = 78) => (
    <input className="in mono" style={{ width: w, padding: '3px 6px' }} type="number" disabled={locked}
      value={value ?? ''} placeholder="0" onChange={e => onChange(parseFloat(e.target.value) || 0)} />
  )
  const floorReps = data.reps.filter(r => r.active && !r.planned)
  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="c6">
        <div className="lbl" style={{ marginBottom: 6 }}>Sales — units & collections by product</div>
        <div className="twrap"><table className="t">
          <thead><tr><th>Product</th><th className="num">Units</th><th className="num">Collections ₹</th></tr></thead>
          <tbody>
            {cfg.products.map(p => (
              <tr key={p.id}>
                <td>{p.short}</td>
                <td className="num">{numIn(log.units[p.id] ?? null, v => upd({ units: { ...log.units, [p.id]: v } }), 64)}</td>
                <td className="num">{numIn(log.collections[p.id] ?? null, v => upd({ collections: { ...log.collections, [p.id]: v } }), 96)}</td>
              </tr>
            ))}
            <tr className="sum"><td>Total</td><td className="num">{num(Object.values(log.units).reduce<number>((s, v) => s + (v || 0), 0))}</td><td className="num">{inr(Math.round(collectionsOf(log)))}</td></tr>
          </tbody>
        </table></div>
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <span className="small dim">Floor totals:</span>
          {numIn(log.dials, v => upd({ dials: v }), 70)}<span className="small faint">dials</span>
          {numIn(log.connects, v => upd({ connects: v }), 70)}<span className="small faint">connects</span>
          {numIn(log.quals, v => upd({ quals: v }), 70)}<span className="small faint">quals</span>
          {numIn(log.speedToLeadMedianMin, v => upd({ speedToLeadMedianMin: v }), 60)}<span className="small faint">median speed-to-lead (min)</span>
        </div>
        <button className="btn sm noprint" style={{ marginTop: 8 }} onClick={() => submitFn('sales')} disabled={locked}><CheckCircle2 size={13} /> Submit Sales EOD</button>
      </div>

      <div className="c6">
        <div className="lbl" style={{ marginBottom: 6 }}>Marketing — leads & spend by channel</div>
        <div className="twrap"><table className="t">
          <thead><tr><th>Channel</th><th className="num">Leads</th><th className="num">Spend ₹</th></tr></thead>
          <tbody>
            {cfg.channels.map(ch => (
              <tr key={ch.id}>
                <td>{ch.name.split(' (')[0]}</td>
                <td className="num">{numIn(log.leadsBySource[ch.id] ?? null, v => upd({ leadsBySource: { ...log.leadsBySource, [ch.id]: v }, leadsIn: Object.entries({ ...log.leadsBySource, [ch.id]: v }).reduce<number>((s, [, x]) => s + (x || 0), 0) }), 64)}</td>
                <td className="num">{ch.paid ? numIn(log.spend[ch.id] ?? null, v => upd({ spend: { ...log.spend, [ch.id]: v } }), 90) : <span className="faint">—</span>}</td>
              </tr>
            ))}
            <tr className="sum"><td>Total</td><td className="num">{num(Object.values(log.leadsBySource).reduce<number>((s, v) => s + (v || 0), 0))}</td><td className="num">{inr(Math.round(Object.values(log.spend).reduce<number>((s, v) => s + (v || 0), 0)))}</td></tr>
          </tbody>
        </table></div>
        <button className="btn sm noprint" style={{ marginTop: 8 }} onClick={() => submitFn('marketing')} disabled={locked}><CheckCircle2 size={13} /> Submit Marketing EOD</button>
      </div>

      <div className="c12">
        <div className="lbl" style={{ marginBottom: 6 }}>Per-rep numbers (feeds scorecards, leaderboard, payroll)</div>
        <div className="twrap"><table className="t">
          <thead><tr><th>Rep</th><th className="num">Dials</th><th className="num">Connects</th><th className="num">Quals</th><th className="num">Sales</th><th className="num">Revenue ₹</th><th className="num">QA /10</th></tr></thead>
          <tbody>
            {floorReps.length === 0 && <tr><td colSpan={7}><div className="empty">No active reps on the floor — add them in Sales Command.</div></td></tr>}
            {floorReps.map(r => {
              const rd = log.reps[r.id] ?? { dials: 0, connects: 0, quals: 0, sales: 0, revenue: 0 }
              const set = (patch: Partial<typeof rd>) => upd({ reps: { ...log.reps, [r.id]: { ...rd, ...patch } } })
              return (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong> <span className="faint small">({r.desk})</span></td>
                  <td className="num">{numIn(rd.dials, v => set({ dials: v }), 64)}</td>
                  <td className="num">{numIn(rd.connects, v => set({ connects: v }), 64)}</td>
                  <td className="num">{numIn(rd.quals, v => set({ quals: v }), 64)}</td>
                  <td className="num">{numIn(rd.sales, v => set({ sales: v }), 64)}</td>
                  <td className="num">{numIn(rd.revenue, v => set({ revenue: v }), 92)}</td>
                  <td className="num">{numIn(rd.qaScore ?? null, v => set({ qaScore: v }), 56)}</td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      </div>

      <div className="c6">
        <Text area label="Operations note (onboarding, tickets, delivery)" value={log.notes.operations ?? ''} onChange={v => upd({ notes: { ...log.notes, operations: v } })} />
        <button className="btn sm noprint" style={{ marginTop: 6 }} onClick={() => submitFn('operations')} disabled={locked}><CheckCircle2 size={13} /> Submit Ops EOD</button>
      </div>
      <div className="c6">
        <Text area label="Finance note (reconciliation, cash, exceptions)" value={log.notes.finance ?? ''} onChange={v => upd({ notes: { ...log.notes, finance: v } })} />
        <button className="btn sm noprint" style={{ marginTop: 6 }} onClick={() => submitFn('finance')} disabled={locked}><CheckCircle2 size={13} /> Submit Finance EOD</button>
      </div>
    </div>
  )
}

function VarianceView({ date }: { date: string }) {
  const { cfg, data } = useStore()
  const lines = useMemo(() => dayVariance(cfg, data, date), [cfg, data, date])
  return (
    <div className="stack">
      <DataTable
        csvName={`variance_${date}`}
        cols={[
          { h: 'Metric', render: (l: typeof lines[number]) => l.metric, csv: l => l.metric },
          { h: 'Plan', num: true, render: l => l.plan, csv: l => l.plan },
          { h: 'Actual', num: true, render: l => l.actual, csv: l => l.actual },
          { h: 'State', render: l => l.ok ? <Pill kind="good">on plan</Pill> : <Pill kind="crit">miss</Pill>, csv: l => l.ok ? 'ok' : 'miss' },
        ]}
        rows={lines}
      />
      <p className="small dim" style={{ margin: 0 }}>Auto-generated at 19:30 from the EOD update. A miss is a work order, not a verdict — the next tab turns it into tomorrow's tasks.</p>
    </div>
  )
}

function TasksView({ date }: { date: string }) {
  const { cfg, data, setData } = useStore()
  const tomorrow = addDays(date, 1)
  const generated = useMemo(() => generateTasks(cfg, data, tomorrow, date), [cfg, data, tomorrow, date])
  const existing = data.tasks.filter(t => t.date === tomorrow)
  const publish = () => {
    setData(d => ({
      ...d,
      tasks: [
        ...d.tasks.filter(t => !(t.date === tomorrow && t.source === 'auto')),
        ...generated.map(g => ({ id: uid('task'), date: tomorrow, fn: g.fn as Fn, text: g.text, done: false, source: 'auto' as const })),
      ],
    }))
  }
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="small dim">Generated from {date}'s variance → task list for <strong>{tomorrow}</strong> (published at 20:00).</span>
        <button className="btn primary noprint" onClick={publish}><ListTodo size={14} /> Publish {generated.length} task(s)</button>
      </div>
      {existing.length > 0 && (
        <div className="stack" style={{ gap: 5 }}>
          {existing.map(t => (
            <label key={t.id} className="check" style={{ background: 'var(--panel2)', padding: '7px 10px', borderRadius: 3 }}>
              <input type="checkbox" checked={t.done} onChange={() => setData(d => ({ ...d, tasks: d.tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x) }))} />
              <span><Pill kind="acc">{FN_LABEL[t.fn]}</Pill> <span style={{ marginLeft: 6 }}>{t.text}</span></span>
            </label>
          ))}
        </div>
      )}
      {existing.length === 0 && (
        <div className="stack" style={{ gap: 5 }}>
          {generated.map((g, i) => (
            <div key={i} className="small" style={{ background: 'var(--panel2)', padding: '7px 10px', borderRadius: 3 }}>
              <Pill kind="plain">{FN_LABEL[g.fn]}</Pill> <span style={{ marginLeft: 6 }}>{g.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function pickExercise(cfg: ReturnType<typeof useStore>['cfg'], data: ReturnType<typeof useStore>['data'], date: string): Exercise {
  const dayN = Math.max(1, Math.round((new Date(date).getTime() - new Date(cfg.sprint.startDate).getTime()) / 86400000) + 1)
  const prev = data.exerciseLog[addDays(date, -1)]?.exerciseId
  const overdueGriev = data.grievances.some(g => g.status === 'open' && g.dueAt <= date)
  const preflightStuck = data.creatives.some(c => c.status === 'preflight')
  const log = data.daily[addDays(date, -1)]
  const closeSoft = log && log.quals > 0 ? (Object.values(log.reps).reduce((s, r) => s + r.sales, 0) / log.quals) < cfg.funnel.closeRate * 0.85 : false
  const trainingLive = data.trainees.some(t => t.certified === 'pending')
  const missingEod = log ? !(log.eod.sales && log.eod.marketing) : false

  let track: Exercise['track'] | null =
    overdueGriev || preflightStuck ? 'compliance'
      : closeSoft ? 'sales'
        : trainingLive && dayN % 3 === 0 ? 'product'
          : missingEod ? 'systems' : null
  if (!track) {
    const rotation: Exercise['track'][] = ['sales', 'compliance', 'product', 'systems', 'leadership', 'marketing', 'review']
    track = dayN % 7 === 0 ? 'review' : rotation[dayN % rotation.length]
  }
  const pool = EXERCISES.filter(e => e.track === track && e.id !== prev)
  const chosen = pool[dayN % Math.max(1, pool.length)] ?? EXERCISES[(dayN - 1) % EXERCISES.length]
  return chosen
}

function ExerciseView({ date }: { date: string }) {
  const { cfg, data, setData } = useStore()
  const entry = data.exerciseLog[date]
  const exercise = useMemo(() => entry ? EXERCISES.find(e => e.id === entry.exerciseId) ?? pickExercise(cfg, data, date) : pickExercise(cfg, data, date), [entry, cfg, data, date])
  const issue = () => setData(d => ({ ...d, exerciseLog: { ...d.exerciseLog, [date]: { exerciseId: exercise.id, issuedAt: new Date().toISOString(), done: {} } } }))
  const groups = ['Desk A', 'Desk B', 'TLs', 'Marketing', 'Ops/Finance']
  return (
    <div className="stack">
      <div className="exercise">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="lbl">Exercise of the day — issued 20:15, due before the 09:00 huddle</span>
          <Pill kind="acc">{exercise.track}</Pill>
        </div>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.5 }}>{exercise.text}</p>
      </div>
      {!entry
        ? <button className="btn primary noprint" style={{ alignSelf: 'flex-start' }} onClick={issue}>Issue this exercise</button>
        : (
          <div className="row">
            {groups.map(g => (
              <label key={g} className="check">
                <input type="checkbox" checked={entry.done[g] ?? false}
                  onChange={() => setData(d => ({ ...d, exerciseLog: { ...d.exerciseLog, [date]: { ...entry, done: { ...entry.done, [g]: !entry.done[g] } } } }))} />
                {g}
              </label>
            ))}
          </div>
        )}
      <p className="small dim" style={{ margin: 0 }}>The generator adapts: close rate soft → sales drill; compliance flag live → compliance drill; academy running → product knowledge; EOD missing → systems hygiene. Otherwise it rotates the five tracks, review on every 7th day. Bank of {EXERCISES.length} exercises on board.</p>
    </div>
  )
}
