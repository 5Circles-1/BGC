import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, Text, Modal, DataTable } from '../components/ui'
import { num, todayISO, uid, diffDays } from '../lib/format'
import { ACADEMY } from '../model/content'
import type { Trainee } from '../model/types'

export default function M08() {
  const { data, setData } = useStore()
  const today = todayISO()
  const [adding, setAdding] = useState(false)
  const [nt, setNt] = useState({ name: '', cohort: 1, startDate: today })

  const certified = data.trainees.filter(t => t.certified === 'passed').length
  const failed = data.trainees.filter(t => t.certified === 'failed').length
  const inTraining = data.trainees.filter(t => t.certified === 'pending').length

  const setQuiz = (t: Trainee, day: number, score: number | undefined) =>
    setData(d => ({ ...d, trainees: d.trainees.map(x => x.id === t.id ? { ...x, quiz: { ...x.quiz, [day]: score } } : x) }))
  const setPractical = (t: Trainee, day: number, v: boolean) =>
    setData(d => ({ ...d, trainees: d.trainees.map(x => x.id === t.id ? { ...x, practical: { ...x.practical, [day]: v } } : x) }))
  const setCert = (t: Trainee, v: Trainee['certified']) =>
    setData(d => ({ ...d, trainees: d.trainees.map(x => x.id === t.id ? { ...x, certified: v } : x) }))
  const setFirstSale = (t: Trainee, v: string) =>
    setData(d => ({ ...d, trainees: d.trainees.map(x => x.id === t.id ? { ...x, firstSaleDate: v || undefined } : x) }))

  const day2Blocked = (t: Trainee) => {
    const s = t.quiz[2]
    return s != null && s < (ACADEMY.find(a => a.day === 2)?.passMark ?? 95)
  }

  const gateState = (t: Trainee, day: number): 'pass' | 'fail' | 'pending' => {
    const a = ACADEMY.find(x => x.day === day)!
    if (a.kind === 'quiz') {
      const s = t.quiz[day]
      if (s == null) return 'pending'
      return s >= (a.passMark ?? 80) ? 'pass' : 'fail'
    }
    if (a.kind === 'practical') {
      const v = t.practical[day]
      if (v == null) return 'pending'
      return v ? 'pass' : 'fail'
    }
    return 'pending'
  }

  const add = () => {
    if (!nt.name.trim()) return
    const t: Trainee = { id: uid('tr'), name: nt.name.trim(), cohort: nt.cohort, startDate: nt.startDate, quiz: {}, practical: {}, certified: 'pending' }
    setData(d => ({ ...d, trainees: [...d.trainees, t] }))
    setAdding(false); setNt(s => ({ ...s, name: '' }))
  }

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="In the Academy" value={num(inTraining)} sub="10-day certification, gated" />
            <Stat label="Certified" value={num(certified)} tone={certified ? 'good' : undefined} sub="cleared the panel — floor access granted" />
            <Stat label="Failed out" value={num(failed)} sub="Day-2 compliance gate is non-negotiable" />
          </div>
          <button className="btn primary noprint" onClick={() => setAdding(true)}><Plus size={14} /> Enroll trainee</button>
        </div>
      </Panel>

      <Panel span={12} title="Certification matrix — quiz % on quiz days, pass/fail on practicals">
        <div className="twrap">
          <table className="t">
            <thead>
              <tr>
                <th>Trainee</th>
                {ACADEMY.map(a => <th key={a.day} className="num" title={`${a.module} — ${a.gate}`}>D{a.day}{a.mandatory ? '★' : ''}</th>)}
                <th>Days in</th><th>Status</th><th>First sale</th>
              </tr>
            </thead>
            <tbody>
              {data.trainees.length === 0 && <tr><td colSpan={14}><div className="empty">Enroll Cohort 1 here on their join date. ★ D2 = SEBI compliance gate, pass ≥95% mandatory.</div></td></tr>}
              {data.trainees.map(t => {
                const blocked = day2Blocked(t)
                return (
                  <tr key={t.id} style={blocked ? { opacity: .65 } : undefined}>
                    <td><strong>{t.name}</strong><div className="small faint">C{t.cohort} · {t.startDate}</div></td>
                    {ACADEMY.map(a => {
                      const st = gateState(t, a.day)
                      const disabled = blocked && a.day > 2
                      if (a.kind === 'quiz') {
                        return (
                          <td key={a.day} className="num">
                            <input className="in mono" style={{ width: 52, padding: '2px 5px', borderColor: st === 'fail' ? 'var(--s-crit)' : st === 'pass' ? 'var(--s-good)' : undefined }}
                              type="number" min={0} max={100} disabled={disabled}
                              value={t.quiz[a.day] ?? ''} placeholder="—"
                              onChange={e => setQuiz(t, a.day, e.target.value === '' ? undefined : Math.max(0, Math.min(100, +e.target.value)))} />
                          </td>
                        )
                      }
                      if (a.kind === 'practical') {
                        return (
                          <td key={a.day} className="num">
                            <button className="btn sm" disabled={disabled} style={{ color: st === 'pass' ? 'var(--s-good)' : st === 'fail' ? 'var(--s-crit)' : undefined }}
                              onClick={() => setPractical(t, a.day, !(t.practical[a.day] ?? false))}>
                              {st === 'pass' ? '✓' : st === 'fail' ? '✗' : '·'}
                            </button>
                          </td>
                        )
                      }
                      return <td key={a.day} className="num faint">{a.day === 10 ? 'panel' : '—'}</td>
                    })}
                    <td className="num">{diffDays(t.startDate, today)}</td>
                    <td>
                      {blocked
                        ? <Pill kind="crit">blocked at D2</Pill>
                        : t.certified === 'passed' ? <Pill kind="good">certified</Pill>
                          : t.certified === 'failed' ? <Pill kind="crit">failed</Pill>
                            : <span className="row noprint" style={{ gap: 4 }}>
                              <button className="btn sm" onClick={() => setCert(t, 'passed')}>Pass panel</button>
                              <button className="btn sm danger" onClick={() => setCert(t, 'failed')}>Fail</button>
                            </span>}
                    </td>
                    <td><input className="in mono" style={{ width: 110, padding: '2px 5px' }} placeholder="YYYY-MM-DD" value={t.firstSaleDate ?? ''} onChange={e => setFirstSale(t, e.target.value)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>A trainee failing D2 (compliance, ≥95%) is blocked from D3 onward — retrain and retake, or fail out. No floor access without the D10 panel pass. Certification date starts the ramp clock in Sales Command.</p>
      </Panel>

      <Panel span={12} title="Curriculum">
        <DataTable
          cols={[
            { h: 'Day', num: true, render: (a: typeof ACADEMY[number]) => a.day, csv: a => a.day },
            { h: 'Module', render: a => a.mandatory ? <strong>{a.module}</strong> : a.module, csv: a => a.module },
            { h: 'Gate', render: a => a.gate, csv: a => a.gate },
          ]}
          rows={ACADEMY}
        />
      </Panel>

      {adding && (
        <Modal title="Enroll trainee" onClose={() => setAdding(false)}>
          <div className="stack">
            <Text label="Name" value={nt.name} onChange={v => setNt(s => ({ ...s, name: v }))} />
            <div className="formrow">
              <Text label="Cohort #" value={String(nt.cohort)} onChange={v => setNt(s => ({ ...s, cohort: parseInt(v) || 1 }))} />
              <Text label="Start date" value={nt.startDate} onChange={v => setNt(s => ({ ...s, startDate: v }))} />
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={add}>Enroll</button></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
