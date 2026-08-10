import React, { useMemo, useState } from 'react'
import { Copy, RotateCcw } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, Text, Modal, useFlash, DataTable } from '../components/ui'
import { inrC, num, pct, todayISO, uid } from '../lib/format'
import { AGENTS, type AgentDef } from '../model/content'
import { pacing, solveFunnel, sprintCal, sprintWeekOf } from '../model/engine'
import { monteCarlo } from '../model/monteCarlo'
import { FN_LABEL } from '../model/defaults'

export default function M13() {
  const { data } = useStore()
  const [open, setOpen] = useState<AgentDef | null>(null)
  const byFn = useMemo(() => {
    const groups = new Map<string, AgentDef[]>()
    for (const a of AGENTS) {
      const k = a.fn === 'ceo' ? 'CEO Office' : FN_LABEL[a.fn] ?? a.fn
      groups.set(k, [...(groups.get(k) ?? []), a])
    }
    return [...groups.entries()]
  }, [])
  const totalRuns = Object.values(data.agents).reduce((s, a) => s + a.runs.length, 0)

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ gap: 26 }}>
          <Stat label="Agents on roster" value={num(AGENTS.length)} sub="7 business functions" />
          <Stat label="Blocking human gates" value={num(AGENTS.filter(a => a.gate === 'blocking').length)} sub="sign-off, pre-flight, fee-cap, KYC" />
          <Stat label="Runs logged" value={num(totalRuns)} sub="run history feeds the AI-use register" />
        </div>
        <div className="note small" style={{ marginTop: 8 }}>
          This console is the agents' registry, prompt library and run log. "Copy run pack" assembles the agent's system prompt plus a live snapshot of the relevant numbers — paste it into Claude, act on the output through the agent's human gate, then log the run here. Agents draft; named humans approve; the dashboard enforces the gates.
        </div>
      </Panel>

      {byFn.map(([fn, agents]) => (
        <Panel key={fn} span={6} title={`${fn} — ${agents.length} agents`}>
          <div className="stack" style={{ gap: 6 }}>
            {agents.map(a => (
              <button key={a.id} className="row" onClick={() => setOpen(a)}
                style={{ justifyContent: 'space-between', background: 'var(--panel2)', border: '1px solid var(--border-soft)', borderRadius: 3, padding: '8px 10px', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}>
                <span>
                  <strong>{a.name}</strong>
                  <span className="small dim" style={{ display: 'block' }}>{a.job}</span>
                </span>
                <span className="row" style={{ gap: 6, flex: 'none' }}>
                  {a.gate === 'blocking' && <Pill kind="crit">gate</Pill>}
                  {a.gate === 'review' && <Pill kind="warn">review</Pill>}
                  <Pill kind="plain">{a.trigger}</Pill>
                </span>
              </button>
            ))}
          </div>
        </Panel>
      ))}

      {open && <AgentModal a={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function AgentModal({ a, onClose }: { a: AgentDef; onClose: () => void }) {
  const { cfg, data, setData } = useStore()
  const state = data.agents[a.id] ?? { runs: [] }
  const [prompt, setPrompt] = useState(state.promptOverride ?? a.prompt)
  const [runNote, setRunNote] = useState('')
  const [runBy, setRunBy] = useState('')
  const [flash, setFlash] = useFlash()

  const savePrompt = () =>
    setData(d => ({ ...d, agents: { ...d.agents, [a.id]: { ...(d.agents[a.id] ?? { runs: [] }), promptOverride: prompt } } }))
  const resetPrompt = () => {
    setPrompt(a.prompt)
    setData(d => ({ ...d, agents: { ...d.agents, [a.id]: { ...(d.agents[a.id] ?? { runs: [] }), promptOverride: undefined } } }))
  }

  const copyPack = async () => {
    const today = todayISO()
    const cal = sprintCal(cfg, today)
    const pace = pacing(cfg, data, today)
    const mc = monteCarlo(cfg, data.reps)
    const week = Math.min(sprintWeekOf(cfg, cal.today), cfg.target.runRatePlanWeekly.length)
    const solved = solveFunnel(cfg, cfg.target.runRatePlanWeekly[week - 1])
    const snapshot = {
      date: today, sprintDay: `D${cal.dayIndex}/${cal.days}`,
      target: `${inrC(pace.targetRunRateEff)}/mo by day 60 (${cfg.target.basis} basis)`,
      pacing: { cumulativeActual: inrC(pace.actualCumToday), cumulativeRequired: inrC(pace.requiredCumToday), perRemainingWorkingDay: inrC(pace.requiredPerRemainingWD), currentRunRate: inrC(pace.currentRunRate) },
      monteCarlo: { pHit: pct(mc.pHit, 0), p50: inrC(mc.p50), p10: inrC(mc.p10), p90: inrC(mc.p90) },
      thisWeekPlan: { runRate: inrC(cfg.target.runRatePlanWeekly[week - 1]), leadsPerDay: Math.round(solved.leadsDaily), dialsPerDay: Math.round(solved.dialsDaily) },
      floor: { repsA: data.reps.filter(r => r.active && !r.planned && r.desk === 'A').length, repsB: data.reps.filter(r => r.active && !r.planned && r.desk === 'B').length, plannedJoins: data.reps.filter(r => r.planned).length },
      compliance: {
        signoffQueue: data.signals.filter(s => s.status === 'awaiting_signoff').length,
        preflightQueue: data.creatives.filter(c => c.status === 'preflight').length,
        openGrievances: data.grievances.filter(g => g.status === 'open').length,
        clientsBlockedAtKyc: data.clients.filter(c => !(c.kyc && c.agreement && c.riskProfile)).length,
      },
      hiring: { inPipeline: data.candidates.filter(c => !c.dropped && c.stage < 4).length, joined: data.candidates.filter(c => !c.dropped && c.stage >= 4).length },
    }
    const pack = [
      `SYSTEM PROMPT — ${a.name} (${a.id})`, prompt, '',
      `HUMAN GATE: ${a.gate}${a.gateBy ? ` — ${a.gateBy}` : ''}. Inputs: ${a.inputs}. Outputs: ${a.outputs}.`, '',
      'LIVE CONTEXT (from OPERATOR):', JSON.stringify(snapshot, null, 2), '',
      'Task: perform your job on this context. If data you need is missing, list exactly what to log in OPERATOR first.',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(pack)
      setFlash('Run pack copied — paste into Claude.')
    } catch {
      setFlash('Clipboard unavailable — select and copy from the prompt box.')
    }
  }

  const logRun = () => {
    if (!runBy.trim()) { setFlash('Log who ran it — the register needs a name.'); return }
    setData(d => ({
      ...d, agents: {
        ...d.agents,
        [a.id]: { ...(d.agents[a.id] ?? {}), promptOverride: d.agents[a.id]?.promptOverride, runs: [{ at: new Date().toISOString(), by: runBy.trim(), note: runNote.trim() || '(no note)' }, ...(d.agents[a.id]?.runs ?? [])] },
      },
    }))
    setRunNote('')
    setFlash('Run logged to the register.')
  }

  return (
    <Modal title={`${a.name} — ${a.fn === 'ceo' ? 'CEO Office' : FN_LABEL[a.fn]}`} onClose={onClose}>
      <div className="stack">
        <div className="kv">
          <dt>Job</dt><dd style={{ fontFamily: 'inherit' }}>{a.job}</dd>
          <dt>Trigger</dt><dd>{a.trigger}</dd>
          <dt>Inputs</dt><dd style={{ fontFamily: 'inherit' }}>{a.inputs}</dd>
          <dt>Outputs</dt><dd style={{ fontFamily: 'inherit' }}>{a.outputs}</dd>
          <dt>Human gate</dt><dd style={{ fontFamily: 'inherit' }}>{a.gate === 'none' ? 'none (non-client-facing)' : `${a.gate} — ${a.gateBy}`}</dd>
        </div>
        <label className="field">
          <span className="lbl">System prompt (editable — stored)</span>
          <textarea className="in" style={{ minHeight: 110, fontSize: 13 }} value={prompt} onChange={e => setPrompt(e.target.value)} />
        </label>
        <div className="row">
          <button className="btn primary" onClick={savePrompt}>Save prompt</button>
          <button className="btn" onClick={resetPrompt}><RotateCcw size={13} /> Restore default</button>
          <button className="btn" onClick={copyPack}><Copy size={13} /> Copy run pack (prompt + live data)</button>
          {flash && <span className="small dim">{flash}</span>}
        </div>
        <hr className="hr" />
        <div className="formrow">
          <Text label="Run by" value={runBy} onChange={setRunBy} placeholder="Name" />
          <Text label="Outcome note" value={runNote} onChange={setRunNote} placeholder="What was produced / decided" />
          <button className="btn" onClick={logRun}>Log run</button>
        </div>
        <DataTable
          cols={[
            { h: 'When', render: (r: { at: string; by: string; note: string }) => <span className="mono small">{r.at.slice(0, 16).replace('T', ' ')}</span>, csv: r => r.at },
            { h: 'By', render: r => r.by, csv: r => r.by },
            { h: 'Note', render: r => <span className="small">{r.note}</span>, csv: r => r.note },
          ]}
          rows={state.runs}
          csvName={`agent_runs_${a.id}`}
          empty="No runs logged yet."
        />
      </div>
    </Modal>
  )
}
