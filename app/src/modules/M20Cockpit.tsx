import React, { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, ArrowRight, UserCheck, UserMinus } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, Progress } from '../components/ui'
import { SeriesBars } from '../components/charts'
import { inr, inrC, num, pct, todayISO, fmtDate, isSunday, addDays } from '../lib/format'
import { collectionsOf, pacing, sprintCal, forecastSprint } from '../model/engine'
import { monteCarlo } from '../model/monteCarlo'
import { departmentStatus, founderDesk, SCALE_MAP, currentStage, type Health } from '../model/org'

const TONE: Record<Health, 'good' | 'warn' | 'serious' | 'crit' | 'plain'> = {
  ok: 'good', watch: 'warn', alarm: 'serious', critical: 'crit', unknown: 'plain',
}

export default function M20({ go }: { go: (m: string) => void }) {
  const { cfg, data } = useStore()
  const today = todayISO()
  const cal = sprintCal(cfg, today)
  const pace = useMemo(() => pacing(cfg, data, today), [cfg, data, today])
  const mc = useMemo(() => monteCarlo(cfg, data.reps), [cfg, data.reps])
  const fc = useMemo(() => forecastSprint(cfg, data.reps), [cfg, data.reps])
  const depts = useMemo(() => departmentStatus(cfg, data, today), [cfg, data, today])
  const desk = useMemo(() => founderDesk(depts), [depts])
  const stage = useMemo(() => currentStage(cfg, data, today), [cfg, data, today])
  const stageIdx = SCALE_MAP.findIndex(s => s.id === stage.id)
  const inPrep = today <= cfg.prep.endDate

  // What business have we actually done
  const done = useMemo(() => {
    const logs = Object.values(data.daily)
    const total = logs.reduce((s, l) => s + collectionsOf(l), 0)
    const units = logs.reduce((s, l) => s + Object.values(l.units).reduce((a, v) => a + (v || 0), 0), 0)
    const month = todayISO().slice(0, 7)
    const thisMonth = logs.filter(l => l.date.startsWith(month)).reduce((s, l) => s + collectionsOf(l), 0)
    const last14 = [] as { d: string; v: number }[]
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i)
      if (isSunday(d)) continue
      last14.push({ d: fmtDate(d), v: collectionsOf(data.daily[d]) })
    }
    return { total, units, thisMonth, last14 }
  }, [data.daily, today])

  const alarms = depts.filter(d => d.health === 'critical' || d.health === 'alarm')

  return (
    <div className="grid">
      {/* ---------- The business, in four numbers ---------- */}
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="row" style={{ gap: 30 }}>
            <Stat label="Business done — sprint to date" value={inrC(done.total)} hero sub={`${num(done.units)} units · ${inrC(done.thisMonth)} this month`} />
            <Stat label="Where we are" value={stage.name} sub={`${stage.runRate} · stage ${stageIdx + 1} of ${SCALE_MAP.length}`} />
            <Stat label="Run-rate now" value={inrC(pace.currentRunRate)} sub={`target ${inrC(pace.targetRunRateEff)}/mo by Day ${cal.days}`} />
            <Stat label="P(target)" value={pct(mc.pHit, 0)} tone={mc.pHit >= 0.5 ? 'good' : undefined} sub={`P50 lands ${inrC(mc.p50)}/mo · forecast ${inrC(fc.day60RunRate)}`} />
          </div>
          <div style={{ minWidth: 210 }}>
            <div className="lbl" style={{ marginBottom: 3 }}>{inPrep ? 'Readiness runway' : 'Against the pace line'}</div>
            <Progress value={pace.requiredCumToday > 0 ? pace.actualCumToday / pace.requiredCumToday : 0} tone={pace.variance >= 0 ? 'g' : 'c'} />
            <div className="small dim" style={{ marginTop: 4 }}>
              {inPrep ? `T−${Math.max(0, Math.round((new Date(cfg.prep.endDate).getTime() - new Date(today).getTime()) / 86400000))} to Day 1 — no collections expected yet.`
                : pace.variance >= 0 ? `${inrC(pace.variance)} ahead. Needs ${inr(Math.round(pace.requiredPerRemainingWD))}/working day.`
                  : `${inrC(-pace.variance)} behind. Needs ${inr(Math.round(pace.requiredPerRemainingWD))}/working day.`}
            </div>
          </div>
        </div>
      </Panel>

      {/* ---------- Founder's desk: the whole point ---------- */}
      <Panel span={6} title={<span><UserCheck size={13} style={{ verticalAlign: -2 }} /> Needs you — {desk.needsHim.length} thing{desk.needsHim.length === 1 ? '' : 's'}</span>}>
        <div className="stack" style={{ gap: 8 }}>
          {desk.needsHim.map((it, i) => (
            <div key={i} className="note" style={{ borderColor: `var(--s-${it.urgency === 'critical' ? 'crit' : it.urgency === 'alarm' ? 'serious' : 'warn'})`, background: 'var(--panel2)' }}>
              <div className="row" style={{ gap: 7, marginBottom: 3 }}>
                <Pill kind={TONE[it.urgency]}>{it.dept}</Pill>
                <strong style={{ fontSize: 14 }}>{it.what}</strong>
              </div>
              <div className="small dim"><strong>Why it has to be you:</strong> {it.why}</div>
            </div>
          ))}
          {desk.needsHim.length === 0 && <div className="note good" style={{ margin: 0 }}><CheckCircle2 size={14} style={{ verticalAlign: -2 }} /> Nothing on your desk. Every open item has a named owner and an agreed rule. Go teach a batch.</div>}
        </div>
        <p className="small dim" style={{ margin: '10px 0 0' }}>
          A founder with five spare hours a week is the scarcest resource in this company. Anything that is reversible, rule-bound and already owned does not appear here.
        </p>
      </Panel>

      <Panel span={6} title={<span><UserMinus size={13} style={{ verticalAlign: -2 }} /> Not yours — being handled</span>}>
        <div className="twrap">
          <table className="t">
            <thead><tr><th>Department</th><th>What is happening</th><th>Owner</th></tr></thead>
            <tbody>
              {desk.handled.map((it, i) => (
                <tr key={i}>
                  <td><Pill kind={TONE[it.urgency]}>{it.dept}</Pill></td>
                  <td><span className="small">{it.what}</span></td>
                  <td><span className="small dim">{it.owner}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>These are listed so you can stop carrying them. If one of these owners is not actually named and briefed, that is itself a founder decision — make it today.</p>
      </Panel>

      {/* ---------- Alarms ---------- */}
      {alarms.length > 0 && (
        <Panel span={12} title={`Departments in trouble — ${alarms.length}`}>
          <div className="stack" style={{ gap: 8 }}>
            {alarms.map(d => (
              <div key={d.def.key} className="note" style={{ borderColor: `var(--s-${d.health === 'critical' ? 'crit' : 'serious'})`, background: 'var(--panel2)' }}>
                <div className="row" style={{ gap: 8, marginBottom: 3 }}>
                  <AlertTriangle size={14} style={{ color: `var(--s-${d.health === 'critical' ? 'crit' : 'serious'})` }} />
                  <strong>{d.def.name}</strong>
                  <Pill kind={TONE[d.health]}>{d.health}</Pill>
                  <span className="small dim">{d.headline}</span>
                </div>
                <div style={{ fontSize: 13.5 }}><strong>Action:</strong> {d.action} <span className="dim">— {d.actionOwner}</span>
                  {d.founderRequired && <Pill kind="crit">founder needed</Pill>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ---------- All departments at once ---------- */}
      <Panel span={12} title="Every department, one line each" right={<button className="btn sm noprint" onClick={() => go('m21')}>Open departments <ArrowRight size={12} /></button>}>
        <div className="twrap">
          <table className="t">
            <thead><tr><th>Department</th><th>Health</th><th>Owns</th><th>Where it stands</th><th>Next action</th><th>You?</th></tr></thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.def.key}>
                  <td><strong>{d.def.name}</strong><div className="small faint">{d.def.ownerRole}</div></td>
                  <td><Pill kind={TONE[d.health]}>{d.health}</Pill></td>
                  <td><span className="small dim">{d.def.ownsNumber}</span></td>
                  <td><span className="small">{d.headline}</span></td>
                  <td><span className="small">{d.action ?? <span className="faint">—</span>}</span></td>
                  <td>{d.founderRequired ? <Pill kind="crit">yes</Pill> : <span className="faint small">no</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ---------- Scaling map ---------- */}
      <Panel span={12} title="The scaling map — and what binds us at each stage">
        <div className="twrap">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SCALE_MAP.length}, minmax(160px, 1fr))`, gap: 6 }}>
            {SCALE_MAP.map((s, i) => {
              const isNow = i === stageIdx, past = i < stageIdx
              return (
                <div key={s.id} className="panel" style={{
                  padding: '10px 11px', background: isNow ? 'var(--accent-soft)' : 'var(--panel2)',
                  borderColor: isNow ? 'var(--accent)' : 'var(--border-soft)', opacity: past ? 0.62 : 1,
                }}>
                  <div className="lbl" style={{ fontSize: 9.5, color: isNow ? 'var(--accent)' : undefined }}>{isNow ? '▶ WE ARE HERE' : `Stage ${i + 1}`}</div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{s.name}</div>
                  <div className="mono small" style={{ color: 'var(--accent)' }}>{s.runRate}</div>
                  <div className="small dim" style={{ marginTop: 6 }}><strong>Binds:</strong> {s.constraint}</div>
                  <div className="small faint" style={{ marginTop: 4 }}>{s.proves}</div>
                </div>
              )
            })}
          </div>
        </div>
        <p className="small dim" style={{ margin: '10px 0 0' }}>
          Each stage is limited by a different thing, and spending money on the wrong constraint is the most common way a growth sprint burns cash. Right now the binding constraint is <strong>{stage.constraint.toLowerCase()}</strong> — more leads would not move the number.
        </p>
      </Panel>

      {/* ---------- Trend ---------- */}
      <Panel span={12} title="Collections — last 14 working days">
        {done.last14.some(x => x.v > 0)
          ? <SeriesBars xKey="d" data={done.last14.map(x => ({ d: x.d, Collections: Math.round(x.v) }))} series={[{ key: 'Collections', name: 'Collections' }]} height={190} />
          : <div className="empty">No collections logged yet. During the readiness runway this is expected — the first rupee lands on Day 1 ({cfg.sprint.startDate}).</div>}
      </Panel>
    </div>
  )
}
