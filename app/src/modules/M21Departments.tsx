import React, { useMemo, useState } from 'react'
import { Plus, Lightbulb } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, DataTable, Text, Select, Num, Modal, Tabs } from '../components/ui'
import { inr, inrC, num, todayISO, uid } from '../lib/format'
import { departmentStatus, DEPTS, STAGES, type DeptKey, type Health, type Initiative, type Stage } from '../model/org'

const TONE: Record<Health, 'good' | 'warn' | 'serious' | 'crit' | 'plain'> = {
  ok: 'good', watch: 'warn', alarm: 'serious', critical: 'crit', unknown: 'plain',
}
const STAGE_TONE: Record<Stage, 'good' | 'warn' | 'serious' | 'crit' | 'acc' | 'plain'> = {
  idea: 'plain', evaluating: 'warn', approved: 'acc', building: 'acc', live: 'good', parked: 'warn', killed: 'crit',
}

export default function M21() {
  const [tab, setTab] = useState('health')
  return (
    <div className="grid">
      <Panel span={12}>
        <Tabs on={tab} set={setTab} tabs={[['health', 'Department health'], ['ideas', 'Ideas & initiatives']]} />
        {tab === 'health' ? <DeptHealth /> : <Ideas />}
      </Panel>
    </div>
  )
}

function DeptHealth() {
  const { cfg, data } = useStore()
  const today = todayISO()
  const depts = useMemo(() => departmentStatus(cfg, data, today), [cfg, data, today])
  const counts = depts.reduce((a, d) => ({ ...a, [d.health]: (a[d.health] ?? 0) + 1 }), {} as Record<string, number>)

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 26 }}>
        <Stat label="Departments" value={num(depts.length)} sub="every function, one model" />
        <Stat label="In alarm or critical" value={num((counts.alarm ?? 0) + (counts.critical ?? 0))} tone={(counts.alarm ?? 0) + (counts.critical ?? 0) ? 'bad' : 'good'} />
        <Stat label="Needing the founder" value={num(depts.filter(d => d.founderRequired && d.action).length)} sub="everything else has an owner and a rule" />
      </div>

      {depts.map(d => (
        <div key={d.def.key} className="panel" style={{ background: 'var(--panel2)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="row" style={{ gap: 9 }}>
              <strong style={{ fontSize: 15 }}>{d.def.name}</strong>
              <Pill kind={TONE[d.health]}>{d.health}</Pill>
              {d.founderRequired && d.action && <Pill kind="crit">founder needed</Pill>}
            </div>
            <span className="small dim">{d.def.ownerRole}</span>
          </div>
          <div className="small dim" style={{ marginBottom: 8 }}>{d.def.mission}</div>
          <div className="twrap" style={{ marginBottom: 8 }}>
            <table className="t">
              <thead><tr><th>Signal</th><th className="num">Now</th><th>State</th><th>What it means</th></tr></thead>
              <tbody>
                {d.signals.map((s, i) => (
                  <tr key={i}>
                    <td>{s.label}</td>
                    <td className="num"><strong>{s.value}</strong></td>
                    <td><Pill kind={TONE[s.health]}>{s.health}</Pill></td>
                    <td><span className="small dim">{s.detail}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.action
            ? <div className="note" style={{ borderColor: `var(--s-${d.health === 'critical' ? 'crit' : d.health === 'alarm' ? 'serious' : 'warn'})` }}>
              <strong>Action:</strong> {d.action} <span className="dim">— owner: {d.actionOwner}.</span>
              <div className="small dim" style={{ marginTop: 3 }}><strong>Founder:</strong> {d.founderWhy}</div>
            </div>
            : <div className="note good"><strong>No action outstanding.</strong> <span className="small dim">{d.founderWhy}</span></div>}
        </div>
      ))}
    </div>
  )
}

function Ideas() {
  const { data, setData } = useStore()
  const today = todayISO()
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState<{ title: string; dept: DeptKey; impact: number; effort: number; owner: string; decisionFrom: Initiative['decisionFrom']; rationale: string }>({
    title: '', dept: 'sales', impact: 0, effort: 1, owner: '', decisionFrom: 'owner', rationale: '',
  })

  const move = (id: string, stage: Stage) =>
    setData(d => ({ ...d, initiatives: d.initiatives.map(x => x.id === id ? { ...x, stage, movedAt: today } : x) }))

  const add = () => {
    if (!f.title.trim()) return
    const it: Initiative = {
      id: uid('ini'), title: f.title.trim(), dept: f.dept, stage: 'idea',
      impactInrMonthly: f.impact, effortDays: f.effort, owner: f.owner || 'unassigned',
      decisionFrom: f.decisionFrom, rationale: f.rationale, createdAt: today, movedAt: today,
    }
    setData(d => ({ ...d, initiatives: [it, ...d.initiatives] }))
    setAdding(false); setF(s => ({ ...s, title: '', rationale: '', impact: 0 }))
  }

  const live = data.initiatives.filter(i => !['killed', 'parked'].includes(i.stage))
  const upside = live.reduce((s, i) => s + i.impactInrMonthly, 0)
  const founderBlocked = data.initiatives.filter(i => i.decisionFrom === 'founder' && ['idea', 'evaluating'].includes(i.stage))

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 26 }}>
          <Stat label="Live initiatives" value={num(live.length)} sub={`${data.initiatives.length} total on the board`} />
          <Stat label="Modelled upside" value={inrC(upside)} sub="₹/month if every live initiative lands" />
          <Stat label="Waiting on the founder" value={num(founderBlocked.length)} tone={founderBlocked.length ? 'bad' : 'good'} sub="ideas that cannot move without a decision from him" />
        </div>
        <button className="btn primary noprint" onClick={() => setAdding(true)}><Plus size={14} /> Add an idea</button>
      </div>

      {founderBlocked.length > 0 && (
        <div className="note warn">
          <Lightbulb size={14} style={{ verticalAlign: -2 }} /> <strong>{founderBlocked.length} idea(s) are parked on a founder decision.</strong> An idea waiting on one person is not an idea, it is a queue. Decide or delegate each of these at the next weekly review: {founderBlocked.map(i => i.title).join(' · ')}
        </div>
      )}

      {DEPTS.map(dept => {
        const rows = data.initiatives.filter(i => i.dept === dept.key)
        if (!rows.length) return null
        return (
          <div key={dept.key}>
            <div className="lbl" style={{ margin: '4px 0 6px', color: 'var(--accent)' }}>{dept.name}</div>
            <DataTable
              csvName={`initiatives_${dept.key}`}
              cols={[
                { h: 'Idea', render: (i: Initiative) => <span><strong>{i.title}</strong><div className="small dim">{i.rationale}</div></span>, csv: i => i.title },
                { h: 'Stage', render: i => <Pill kind={STAGE_TONE[i.stage]}>{i.stage}</Pill>, csv: i => i.stage },
                { h: 'Impact/mo', num: true, render: i => (i.impactInrMonthly ? inrC(i.impactInrMonthly) : '—'), csv: i => i.impactInrMonthly },
                { h: 'Effort', num: true, render: i => `${i.effortDays}d`, csv: i => i.effortDays },
                { h: 'Owner', render: i => <span className="small">{i.owner}</span>, csv: i => i.owner },
                { h: 'Decision from', render: i => <Pill kind={i.decisionFrom === 'founder' ? 'crit' : 'plain'}>{i.decisionFrom}</Pill>, csv: i => i.decisionFrom },
                {
                  h: 'Move', render: i => (
                    <span style={{ display: 'inline-block', minWidth: 120 }} className="noprint">
                      <Select value={i.stage} onChange={v => move(i.id, v as Stage)} options={STAGES.map(s => [s, s])} />
                    </span>
                  ),
                },
              ]}
              rows={rows}
            />
          </div>
        )
      })}

      {adding && (
        <Modal title="Add an idea" onClose={() => setAdding(false)}>
          <div className="stack">
            <Text label="What is the idea?" value={f.title} onChange={v => setF(s => ({ ...s, title: v }))} />
            <Text area label="Why — the argument for it, in a sentence or two" value={f.rationale} onChange={v => setF(s => ({ ...s, rationale: v }))} />
            <div className="formrow">
              <Select label="Department" value={f.dept} onChange={v => setF(s => ({ ...s, dept: v as DeptKey }))} options={DEPTS.map(d => [d.key, d.name])} />
              <Num label="Impact ₹/month" value={f.impact} step={10000} onChange={v => setF(s => ({ ...s, impact: v }))} />
              <Num label="Effort (days)" value={f.effort} onChange={v => setF(s => ({ ...s, effort: v }))} />
            </div>
            <div className="formrow">
              <Text label="Owner" value={f.owner} onChange={v => setF(s => ({ ...s, owner: v }))} placeholder="A name, not a department" />
              <Select label="Decision from" value={f.decisionFrom} onChange={v => setF(s => ({ ...s, decisionFrom: v as Initiative['decisionFrom'] }))}
                options={[['owner', 'The owner — just do it'], ['head', 'Function head'], ['compliance-officer', 'Compliance Officer'], ['founder', 'Founder (expensive — be sure)'], ['board', 'Board']]} />
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={add}>Add to the board</button></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
