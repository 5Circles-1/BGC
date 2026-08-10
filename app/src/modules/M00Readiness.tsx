import React, { useMemo, useState } from 'react'
import { ShieldAlert, CheckCircle2, CircleDashed, Printer } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Tabs, Text, Select, Progress, useFlash } from '../components/ui'
import { num, pct, todayISO, diffDays, fmtDate, addDays } from '../lib/format'
import { PREP_STEPS, PREP_GATES, PREP_ROLES, PREP_TOOLS, TRIPWIRES, DOMAIN_LABEL, type DomainKey } from '../model/prelaunch'
import type { GateState, GateStatus, StepState } from '../model/types'

export default function M00() {
  const [tab, setTab] = useState('gates')
  const { cfg, data } = useStore()
  const today = todayISO()

  const tMinus = diffDays(today, cfg.prep.endDate)          // days until T-0
  const dayOne = addDays(cfg.prep.endDate, 1)
  const inPrep = today >= cfg.prep.startDate && today <= cfg.prep.endDate

  const gateRows = PREP_GATES.map(g => ({ g, st: data.readiness.gates[g.id] }))
  const blocking = gateRows.filter(r => r.g.blocksLaunch)
  const blockingPassed = blocking.filter(r => r.st?.status === 'passed' || r.st?.status === 'waived').length
  const failed = gateRows.filter(r => r.st?.status === 'failed').length
  const stepsDone = PREP_STEPS.filter(s => data.readiness.steps[s.id]?.done).length
  const canLaunch = blocking.length > 0 && blockingPassed === blocking.length && failed === 0

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="Readiness runway" value={inPrep ? `T−${Math.max(0, tMinus)}` : tMinus < 0 ? 'Launched' : `T−${tMinus}`} hero
              sub={`${cfg.prep.startDate} → ${cfg.prep.endDate} · Day 1 = ${dayOne}`} />
            <Stat label="Launch gates" value={`${blockingPassed}/${blocking.length}`} tone={canLaunch ? 'good' : undefined}
              sub={`${failed} failed · ${PREP_GATES.length - blocking.length} non-blocking`} />
            <Stat label="Runway steps" value={`${stepsDone}/${PREP_STEPS.length}`} sub="owner-checked, not self-declared" />
            <div style={{ minWidth: 200, alignSelf: 'center' }}>
              <div className="lbl" style={{ marginBottom: 3 }}>Blocking-gate progress</div>
              <Progress value={blocking.length ? blockingPassed / blocking.length : 0} tone={canLaunch ? 'g' : failed ? 'c' : undefined} />
            </div>
          </div>
          <button className="btn noprint" onClick={() => window.print()}><Printer size={14} /> Print runway</button>
        </div>
        <div className={`note ${canLaunch ? 'good' : 'warn'}`} style={{ marginTop: 10 }}>
          {canLaunch
            ? <><CheckCircle2 size={14} style={{ verticalAlign: -2 }} /> <strong>Launch authorised.</strong> Every blocking gate is passed or formally waived with evidence on record. Day 1 proceeds on {dayOne}.</>
            : <><ShieldAlert size={14} style={{ verticalAlign: -2 }} /> <strong>Not cleared for launch.</strong> {blocking.length - blockingPassed} blocking gate(s) outstanding{failed ? `, ${failed} failed` : ''}. A gate is passed when the <em>verifier</em> — not the doer — records evidence. Launching through a red gate is how a regulated business loses its registration; slipping Day 1 by three days is how it doesn't.</>}
        </div>
      </Panel>

      <Panel span={12}>
        <Tabs on={tab} set={setTab} tabs={[['gates', 'Launch gates'], ['runway', 'Day-by-day runway'], ['roles', 'Role charter'], ['tools', 'Tool stack'], ['tripwires', 'Offline tripwires']]} />
        {tab === 'gates' && <Gates />}
        {tab === 'runway' && <Runway />}
        {tab === 'roles' && <Roles />}
        {tab === 'tools' && <Tools />}
        {tab === 'tripwires' && <Tripwires />}
      </Panel>
    </div>
  )
}

const GATE_KIND: Record<GateStatus, 'good' | 'warn' | 'crit' | 'acc' | 'plain'> = {
  passed: 'good', in_progress: 'acc', failed: 'crit', waived: 'warn', not_started: 'plain',
}

function Gates() {
  const { data, setData } = useStore()
  const [flash, setFlash] = useFlash()
  const upd = (id: string, patch: Partial<GateState>) =>
    setData(d => ({
      ...d,
      readiness: {
        ...d.readiness,
        gates: {
          ...d.readiness.gates,
          [id]: {
            ...({ status: 'not_started', evidence: '', verifiedBy: '' } as GateState),
            ...d.readiness.gates[id],
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    }))
  const setStatus = (id: string, status: GateStatus) => {
    const g = PREP_GATES.find(x => x.id === id)!
    const st = data.readiness.gates[id]
    if ((status === 'passed' || status === 'waived') && !st?.verifiedBy?.trim()) {
      setFlash(`${g.id} needs a named verifier before it can be marked ${status}. The doer cannot pass their own gate.`)
      return
    }
    upd(id, { status })
  }

  return (
    <div className="stack">
      {flash && <div className="note crit">{flash}</div>}
      <DataTable
        csvName="launch_gates"
        cols={[
          { h: 'Gate', render: (r: { g: typeof PREP_GATES[number]; st?: GateState }) => <span><strong className="mono">{r.g.id}</strong> {r.g.name}{r.g.blocksLaunch && <Pill kind="crit">blocking</Pill>}</span>, csv: r => `${r.g.id} ${r.g.name}` },
          { h: 'Domain', render: r => <span className="small dim">{DOMAIN_LABEL[r.g.domain]}</span>, csv: r => r.g.domain },
          { h: 'Pass test (binary)', render: r => <span className="small">{r.g.passTest}</span>, csv: r => r.g.passTest },
          { h: 'Due', render: r => <span className="mono small">{r.g.dueDay}</span>, csv: r => r.g.dueDay },
          { h: 'Verifier', render: r => <span style={{ display: 'inline-block', minWidth: 130 }}><Text value={r.st?.verifiedBy ?? ''} onChange={v => upd(r.g.id, { verifiedBy: v })} placeholder={r.g.verifier} /></span>, csv: r => r.st?.verifiedBy ?? '' },
          { h: 'Evidence', render: r => <span style={{ display: 'inline-block', minWidth: 170 }}><Text value={r.st?.evidence ?? ''} onChange={v => upd(r.g.id, { evidence: v })} placeholder="link / doc / who confirmed" /></span>, csv: r => r.st?.evidence ?? '' },
          {
            h: 'Status', render: r => (
              <span className="row" style={{ gap: 6 }}>
                <Pill kind={GATE_KIND[r.st?.status ?? 'not_started']}>{(r.st?.status ?? 'not_started').replace('_', ' ')}</Pill>
                <Select value={r.st?.status ?? 'not_started'} onChange={v => setStatus(r.g.id, v as GateStatus)}
                  options={[['not_started', '—'], ['in_progress', 'In progress'], ['passed', 'Passed'], ['failed', 'Failed'], ['waived', 'Waived (CO)']]} />
              </span>
            ), csv: r => r.st?.status ?? 'not_started',
          },
        ]}
        rows={PREP_GATES.map(g => ({ g, st: data.readiness.gates[g.id] }))}
      />
      <p className="small dim" style={{ margin: 0 }}>Gates are binary and verified by someone other than the person who did the work. "Waived" is a Compliance-Officer decision with written reasoning in the evidence field — it is not a synonym for "we ran out of time".</p>
    </div>
  )
}

function Runway() {
  const { data, setData } = useStore()
  const [domain, setDomain] = useState<string>('all')
  const [hideDone, setHideDone] = useState(false)

  const rows = PREP_STEPS.filter(s => (domain === 'all' || s.domain === domain) && (!hideDone || !data.readiness.steps[s.id]?.done))
  const byDay = useMemo(() => {
    const m = new Map<string, typeof rows>()
    for (const s of rows) m.set(s.day, [...(m.get(s.day) ?? []), s])
    return [...m.entries()]
  }, [rows])

  const toggle = (id: string) =>
    setData(d => {
      const cur: StepState = d.readiness.steps[id] ?? { done: false }
      return { ...d, readiness: { ...d.readiness, steps: { ...d.readiness.steps, [id]: { ...cur, done: !cur.done, doneAt: !cur.done ? new Date().toISOString() : undefined } } } }
    })

  const hoursByDay = (day: string) => PREP_STEPS.filter(s => s.day === day).reduce((a, s) => a + s.hours, 0)

  return (
    <div className="stack">
      <div className="row noprint">
        <Select label="Domain" value={domain} onChange={setDomain} options={[['all', 'All domains'], ...Object.entries(DOMAIN_LABEL).map(([k, v]) => [k, v] as [string, string])]} />
        <label className="check" style={{ alignSelf: 'flex-end', paddingBottom: 6 }}><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> hide completed</label>
        <span className="small dim" style={{ alignSelf: 'flex-end', paddingBottom: 6 }}>{rows.length} steps shown · {num(rows.reduce((a, s) => a + s.hours, 0))} h total</span>
      </div>
      {byDay.map(([day, steps]) => (
        <div key={day}>
          <div className="row" style={{ gap: 10, margin: '4px 0 4px' }}>
            <span className="lbl" style={{ color: 'var(--accent)' }}>{day}</span>
            <span className="small dim">{steps[0]?.date}</span>
            <span className="small faint">· {num(hoursByDay(day))} h scheduled across the org</span>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {steps.map(s => {
              const st = data.readiness.steps[s.id]
              return (
                <label key={s.id} className="check" style={{ background: 'var(--panel2)', padding: '7px 10px', borderRadius: 3, opacity: st?.done ? 0.6 : 1 }}>
                  <input type="checkbox" checked={st?.done ?? false} onChange={() => toggle(s.id)} />
                  <span style={{ flex: 1 }}>
                    <span className="row" style={{ gap: 6 }}>
                      <Pill kind="plain">{DOMAIN_LABEL[s.domain]}</Pill>
                      <strong style={{ textDecoration: st?.done ? 'line-through' : undefined }}>{s.action}</strong>
                    </span>
                    <span className="small dim" style={{ display: 'block', marginTop: 2 }}>
                      <strong>{s.owner}</strong> · {s.hours}h · produces: {s.output}{s.dependsOn ? ` · needs: ${s.dependsOn}` : ''}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
      {byDay.length === 0 && <div className="empty">Nothing matches this filter.</div>}
    </div>
  )
}

function Roles() {
  const [domain, setDomain] = useState<string>('all')
  const rows = PREP_ROLES.filter(r => domain === 'all' || r.domain === domain)
  return (
    <div className="stack">
      <Select label="Domain" value={domain} onChange={setDomain} options={[['all', 'All domains'], ...Object.entries(DOMAIN_LABEL).map(([k, v]) => [k, v] as [string, string])]} />
      <DataTable
        csvName="role_charter"
        cols={[
          { h: 'Role', render: (r: typeof PREP_ROLES[number]) => <strong>{r.role}</strong>, csv: r => r.role },
          { h: 'Who', render: r => r.person === 'HIRE' ? <Pill kind="warn">to hire</Pill> : <span>{r.person}</span>, csv: r => r.person },
          { h: 'Mandate in prep', render: r => <span className="small">{r.mandate}</span>, csv: r => r.mandate },
          { h: 'Owns these numbers', render: r => <span className="small dim">{r.ownsNumbers.join(' · ')}</span>, csv: r => r.ownsNumbers.join('; ') },
          { h: 'Stops doing', render: r => <span className="small" style={{ color: 'var(--s-serious)' }}>{r.stopsDoing}</span>, csv: r => r.stopsDoing },
        ]}
        rows={rows}
      />
      <p className="small dim" style={{ margin: 0 }}>Every added mandate has a matching subtraction. A role charter without a "stops doing" column is a wish list — the hours have to come from somewhere, and in a 17-person company they come from the offline business unless you say otherwise.</p>
    </div>
  )
}

function Tools() {
  const total = PREP_TOOLS.reduce((a, t) => a + (t.costInrMonthly ?? 0), 0)
  return (
    <div className="stack">
      <Stat label="Recurring tool cost at full stack" value={`₹${total.toLocaleString('en-IN')}/month`} sub={`${PREP_TOOLS.length} tools · budget line in Config → opex "Technology stack"`} />
      <DataTable
        csvName="tool_stack"
        cols={[
          { h: 'Tool', render: (t: typeof PREP_TOOLS[number]) => <strong>{t.tool}</strong>, csv: t => t.tool },
          { h: 'Purpose', render: t => <span className="small">{t.purpose}</span>, csv: t => t.purpose },
          { h: 'Domain', render: t => <span className="small dim">{DOMAIN_LABEL[t.domain]}</span>, csv: t => t.domain },
          { h: 'Owner', render: t => t.owner, csv: t => t.owner },
          { h: '₹/month', num: true, render: t => t.costInrMonthly ? `₹${t.costInrMonthly.toLocaleString('en-IN')}` : '—', csv: t => t.costInrMonthly ?? 0 },
          { h: 'Lead time', render: t => <span className="small">{t.leadTime}</span>, csv: t => t.leadTime },
          { h: 'Without it', render: t => <span className="small" style={{ color: 'var(--s-serious)' }}>{t.failureMode}</span>, csv: t => t.failureMode },
        ]}
        rows={PREP_TOOLS}
        sumRow={['Total', '', '', '', `₹${total.toLocaleString('en-IN')}`, '', '']}
      />
    </div>
  )
}

function Tripwires() {
  const { data, setData } = useStore()
  return (
    <div className="stack">
      <div className="note warn">
        The offline business (~₹5.9L/month) is the floor under this sprint and it pays today's salaries. These are the pre-agreed tripwires: if one trips, the pull-back action happens automatically — it is not re-debated while the sprint is running and everyone is tired.
      </div>
      <DataTable
        csvName="offline_tripwires"
        cols={[
          { h: 'Metric', render: (t: typeof TRIPWIRES[number]) => <strong>{t.metric}</strong>, csv: t => t.metric },
          { h: 'Baseline (record at T-0)', render: t => <span style={{ display: 'inline-block', minWidth: 110 }}><Text value={data.readiness.tripwireBaseline[t.metric] ?? ''} onChange={v => setData(d => ({ ...d, readiness: { ...d.readiness, tripwireBaseline: { ...d.readiness.tripwireBaseline, [t.metric]: v } } }))} placeholder="measure now" /></span>, csv: t => data.readiness.tripwireBaseline[t.metric] ?? '' },
          { h: 'Trips at', render: t => <span className="mono small" style={{ color: 'var(--s-crit)' }}>{t.threshold}</span>, csv: t => t.threshold },
          { h: 'Automatic pull-back action', render: t => <span className="small">{t.action}</span>, csv: t => t.action },
          { h: 'Owner', render: t => t.owner, csv: t => t.owner },
        ]}
        rows={TRIPWIRES}
      />
      <p className="small dim" style={{ margin: 0 }}>Baselines must be measured during prep, before anything changes — a tripwire with no baseline cannot trip. Review every Monday in the WBR alongside the sprint numbers.</p>
    </div>
  )
}
