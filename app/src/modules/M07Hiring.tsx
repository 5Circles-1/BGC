import React, { useMemo, useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Text, Select, Modal } from '../components/ui'
import { num, todayISO, uid, diffDays } from '../lib/format'
import { HIRING_STAGES, type Candidate } from '../model/types'
import { FN_LABEL } from '../model/defaults'

export default function M07() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const [adding, setAdding] = useState(false)
  const [nc, setNc] = useState({ role: 'Desk A closers', name: '', source: 'Apna' })

  const activeCands = data.candidates.filter(c => !c.dropped)
  const stageCounts = HIRING_STAGES.map((_, i) => activeCands.filter(c => c.stage === i).length)
  const joined = activeCands.filter(c => c.stage >= 4).length
  const sourced = data.candidates.length

  const onFloor = useMemo(() => {
    const map = new Map<string, number>()
    // Count actual (non-planned) reps toward the sales roles
    const a = data.reps.filter(r => r.active && !r.planned && r.desk === 'A').length
    const b = data.reps.filter(r => r.active && !r.planned && r.desk === 'B').length
    map.set('Desk A closers', a); map.set('Desk B closers', b)
    return map
  }, [data.reps])

  const advance = (c: Candidate, dir: 1 | -1) => {
    setData(d => ({
      ...d, candidates: d.candidates.map(x => x.id === c.id
        ? { ...x, stage: Math.max(0, Math.min(HIRING_STAGES.length - 1, x.stage + dir)), enteredStageAt: today, history: [...x.history, { stage: x.stage + dir, at: today }] }
        : x),
    }))
  }

  const add = () => {
    if (!nc.name.trim()) return
    const c: Candidate = { id: uid('cand'), role: nc.role, name: nc.name.trim(), source: nc.source, stage: 0, enteredStageAt: today, history: [{ stage: 0, at: today }] }
    setData(d => ({ ...d, candidates: [c, ...d.candidates] }))
    setAdding(false); setNc(s => ({ ...s, name: '' }))
  }

  const roles = [...new Set(cfg.headcountPlan.map(h => h.role))]

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="Sourced → joined" value={`${num(sourced)} → ${num(joined)}`} sub={sourced > 0 ? `${Math.round(joined / sourced * 100)}% yield — plan for 6× sourcing per seat` : 'source at 6× target headcount; offer-to-join runs 45–55% in tier-2 telesales'} />
            <Stat label="In pipeline now" value={num(activeCands.filter(c => c.stage < 4).length)} sub="pre-join stages" />
            <Stat label="Dropped" value={num(data.candidates.filter(c => c.dropped).length)} sub="expect ~20% first-fortnight dropout — backfill immediately" />
          </div>
          <button className="btn primary noprint" onClick={() => setAdding(true)}><Plus size={14} /> Add candidate</button>
        </div>
      </Panel>

      <Panel span={12} title="Pipeline by stage">
        <div className="twrap">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HIRING_STAGES.length}, minmax(86px, 1fr))`, gap: 6 }}>
            {HIRING_STAGES.map((s, i) => (
              <div key={s} className="panel" style={{ padding: '8px 10px', textAlign: 'center', background: stageCounts[i] ? 'var(--panel2)' : 'var(--panel)' }}>
                <div className="lbl" style={{ fontSize: 9.5 }}>{s}</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{stageCounts[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel span={7} title="Candidates">
        <DataTable
          csvName="hiring_pipeline"
          cols={[
            { h: 'Name', render: (c: Candidate) => <strong>{c.name}</strong>, csv: c => c.name },
            { h: 'Role', render: c => <span className="small">{c.role}</span>, csv: c => c.role },
            { h: 'Source', render: c => <span className="small dim">{c.source}</span>, csv: c => c.source },
            { h: 'Stage', render: c => <Pill kind={c.stage >= 4 ? 'good' : 'acc'}>{HIRING_STAGES[c.stage]}</Pill>, csv: c => HIRING_STAGES[c.stage] },
            { h: 'Days in stage', num: true, render: c => { const dd = diffDays(c.enteredStageAt, today); return <span className={dd > 5 && c.stage < 4 ? 'delta-bad' : ''}>{dd}</span> }, csv: c => diffDays(c.enteredStageAt, today) },
            {
              h: '', render: c => (
                <span className="row noprint" style={{ gap: 5 }}>
                  <button className="btn sm" disabled={c.stage === 0 || !!c.dropped} onClick={() => advance(c, -1)}>◂</button>
                  <button className="btn sm" disabled={c.stage >= HIRING_STAGES.length - 1 || !!c.dropped} onClick={() => advance(c, 1)}><ChevronRight size={12} /></button>
                  <button className="btn sm danger" onClick={() => setData(d => ({ ...d, candidates: d.candidates.map(x => x.id === c.id ? { ...x, dropped: !x.dropped } : x) }))}>{c.dropped ? 'Restore' : 'Drop'}</button>
                </span>
              ),
            },
          ]}
          rows={[...data.candidates].sort((a, b) => b.stage - a.stage)}
          empty="No candidates yet. The two dates that decide the sprint: ad verification and Cohort 1 joining — both inside Week 1."
        />
      </Panel>

      <Panel span={5} title="Headcount plan vs actual (29-seat org)">
        <DataTable
          csvName="headcount"
          cols={[
            { h: 'Function', render: (h: typeof cfg.headcountPlan[number]) => FN_LABEL[h.fn] ?? h.fn, csv: h => h.fn },
            { h: 'Role', render: h => <span className="small">{h.role}</span>, csv: h => h.role },
            { h: 'Plan', num: true, render: h => h.planned, csv: h => h.planned },
            {
              h: 'Joined', num: true, render: h => {
                const viaPipeline = activeCands.filter(c => c.role === h.role && c.stage >= 4).length
                const floor = onFloor.get(h.role) ?? 0
                const have = Math.max(viaPipeline, floor)
                return <span className={have >= h.planned ? 'delta-good' : ''}>{have}</span>
              }, csv: h => Math.max(activeCands.filter(c => c.role === h.role && c.stage >= 4).length, onFloor.get(h.role) ?? 0),
            },
          ]}
          rows={cfg.headcountPlan}
          sumRow={['Total', '', String(cfg.headcountPlan.reduce((s, h) => s + h.planned, 0)), String(cfg.headcountPlan.reduce((s, h) => s + Math.max(activeCands.filter(c => c.role === h.role && c.stage >= 4).length, onFloor.get(h.role) ?? 0), 0))]}
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>Candidates reaching "Joined" on sales roles should be added to the Sales Command roster (and the Academy) the same day.</p>
      </Panel>

      {adding && (
        <Modal title="Add candidate" onClose={() => setAdding(false)}>
          <div className="stack">
            <Text label="Name" value={nc.name} onChange={v => setNc(s => ({ ...s, name: v }))} />
            <div className="formrow">
              <Select label="Role" value={nc.role} onChange={v => setNc(s => ({ ...s, role: v }))} options={roles.map(r => [r, r])} />
              <Select label="Source" value={nc.source} onChange={v => setNc(s => ({ ...s, source: v }))} options={[['Apna', 'Apna'], ['WorkIndia', 'WorkIndia'], ['Naukri', 'Naukri'], ['Referral', 'Referral'], ['Walk-in', 'Walk-in'], ['Other', 'Other']]} />
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={add}>Add to pipeline</button></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
