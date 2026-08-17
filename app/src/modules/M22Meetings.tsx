import React, { useMemo, useState } from 'react'
import { Plus, Printer, CheckCircle2 } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, DataTable, Text, Select, Modal, useFlash, Progress } from '../components/ui'
import { inr, inrC, num, pct, todayISO, fmtDate, fmtDateFull, uid, addDays, diffDays } from '../lib/format'
import { collectionsOf, pacing, sprintCal } from '../model/engine'
import { departmentStatus, MEETING_DEF, type Decision, type Meeting, type MeetingKind } from '../model/org'

/** The business is run in meetings, so the meetings live in the tool — with the
 *  only metric that makes a meeting real: were the decisions actually done. */
export default function M22() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const cal = sprintCal(cfg, today)
  const pace = useMemo(() => pacing(cfg, data, today), [cfg, data, today])
  const depts = useMemo(() => departmentStatus(cfg, data, today), [cfg, data, today])
  const [open, setOpen] = useState<Meeting | null>(null)
  const [flash, setFlash] = useFlash()

  const allDecisions = data.meetings.flatMap(m => m.decisions)
  const doneCount = allDecisions.filter(d => d.done).length
  const overdue = allDecisions.filter(d => !d.done && d.due <= today)

  // The agenda assembles itself from live state — nobody prepares a deck.
  const agendaFor = (kind: MeetingKind): string[] => {
    const a: string[] = []
    a.push(`The number: ${inrC(pace.actualCumToday)} cumulative against ${inrC(pace.requiredCumToday)} required — ${pace.variance >= 0 ? 'ahead' : 'behind'} by ${inrC(Math.abs(pace.variance))}. Needs ${inr(Math.round(pace.requiredPerRemainingWD))} per remaining working day.`)
    for (const d of depts.filter(x => x.health === 'critical' || x.health === 'alarm')) {
      a.push(`${d.def.name} — ${d.headline}. Action: ${d.action} (${d.actionOwner})${d.founderRequired ? ' — needs the founder' : ''}.`)
    }
    if (overdue.length) a.push(`${overdue.length} decision(s) past their due date from earlier meetings — close or re-own them before anything new is agreed.`)
    if (kind === 'wbr') {
      a.push('Each function: KPI table, one win, one fix. Five minutes each, numbers first.')
      a.push('Kill/scale decisions on offers and campaigns — from the tracker, not from opinions.')
      const blocked = data.initiatives.filter(i => i.decisionFrom === 'founder' && ['idea', 'evaluating'].includes(i.stage))
      if (blocked.length) a.push(`Ideas waiting on a founder decision: ${blocked.map(i => i.title).join(' · ')}.`)
    }
    if (kind === 'checkpoint') {
      a.push('Re-forecast against real CPL, connect and close rates. Decide which scenario we are living in.')
      a.push('Go/no-go on the next spend tranche and the next hiring cohort.')
    }
    if (kind === 'board') {
      a.push('P&L, unit economics, cash and runway, compliance register. One page each.')
    }
    if (a.length === 1) a.push('No alarms. Push the advantage: raise the stretch 10% and bank the surplus.')
    return a
  }

  const create = (kind: MeetingKind) => {
    const m: Meeting = {
      id: uid('mtg'), kind, date: today, chair: MEETING_DEF[kind].chair, attendees: '',
      decisions: [], notes: agendaFor(kind).map((x, i) => `${i + 1}. ${x}`).join('\n'), closed: false,
    }
    setData(d => ({ ...d, meetings: [m, ...d.meetings] }))
    setOpen(m); setFlash(`${MEETING_DEF[kind].name} created with the agenda already assembled.`)
  }

  const upd = (m: Meeting, patch: Partial<Meeting>) => {
    const next = { ...m, ...patch }
    setData(d => ({ ...d, meetings: d.meetings.map(x => x.id === m.id ? next : x) }))
    setOpen(next)
  }

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="Meetings held" value={num(data.meetings.length)} sub={`${data.meetings.filter(m => !m.closed).length} still open`} />
            <Stat label="Decisions made" value={num(allDecisions.length)} sub={`${doneCount} done, ${allDecisions.length - doneCount} outstanding`} />
            <Stat label="Follow-through" value={allDecisions.length ? pct(doneCount / allDecisions.length, 0) : '—'}
              tone={allDecisions.length && doneCount / allDecisions.length >= 0.8 ? 'good' : allDecisions.length ? 'bad' : undefined}
              sub="the only number that makes a meeting real" />
            <Stat label="Past due" value={num(overdue.length)} tone={overdue.length ? 'bad' : 'good'} />
          </div>
          <div className="row noprint">
            {(['warroom', 'wbr', 'checkpoint', 'board'] as MeetingKind[]).map(k => (
              <button key={k} className={`btn ${k === 'warroom' ? 'primary' : ''}`} onClick={() => create(k)}><Plus size={13} /> {MEETING_DEF[k].name}</button>
            ))}
          </div>
        </div>
        {flash && <div className="note good" style={{ marginTop: 8 }}>{flash}</div>}
        {allDecisions.length > 0 && (
          <div style={{ marginTop: 10, maxWidth: 420 }}>
            <div className="lbl" style={{ marginBottom: 3 }}>Decisions made vs decisions done</div>
            <Progress value={doneCount / allDecisions.length} tone={doneCount / allDecisions.length >= 0.8 ? 'g' : 'c'} />
          </div>
        )}
      </Panel>

      {overdue.length > 0 && (
        <Panel span={12} title="Decisions past their date — close these before agreeing anything new">
          <DataTable
            cols={[
              { h: 'Decision', render: (d: Decision) => d.text, csv: d => d.text },
              { h: 'Owner', render: d => d.owner, csv: d => d.owner },
              { h: 'Due', render: d => <span className="mono delta-bad">{fmtDate(d.due)}</span>, csv: d => d.due },
              { h: 'Days late', num: true, render: d => diffDays(d.due, today), csv: d => diffDays(d.due, today) },
            ]}
            rows={overdue}
            csvName="overdue_decisions"
          />
        </Panel>
      )}

      <Panel span={12} title="Meeting log">
        <DataTable
          csvName="meetings"
          cols={[
            { h: 'Date', render: (m: Meeting) => fmtDate(m.date), csv: m => m.date },
            { h: 'Meeting', render: m => <button className="linkish" onClick={() => setOpen(m)}>{MEETING_DEF[m.kind].name}</button>, csv: m => MEETING_DEF[m.kind].name },
            { h: 'Chair', render: m => <span className="small">{m.chair}</span>, csv: m => m.chair },
            { h: 'Decisions', num: true, render: m => m.decisions.length, csv: m => m.decisions.length },
            { h: 'Done', num: true, render: m => `${m.decisions.filter(d => d.done).length}/${m.decisions.length}`, csv: m => m.decisions.filter(d => d.done).length },
            { h: 'State', render: m => <Pill kind={m.closed ? 'good' : 'warn'}>{m.closed ? 'closed' : 'open'}</Pill>, csv: m => m.closed ? 'closed' : 'open' },
          ]}
          rows={data.meetings}
          empty="No meetings yet. Start the daily war room — the agenda assembles itself from live state, so nobody has to prepare a deck."
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>
          Cadence: war room every working day at 09:00 (20 min) · weekly review Monday 10:00 (60 min) · checkpoints at Day 15, 30 and 45 · board pack monthly. A missing number is treated exactly like a bad number.
        </p>
      </Panel>

      {open && <MeetingModal m={open} onClose={() => setOpen(null)} upd={upd} />}
    </div>
  )
}

function MeetingModal({ m, onClose, upd }: { m: Meeting; onClose: () => void; upd: (m: Meeting, p: Partial<Meeting>) => void }) {
  const today = todayISO()
  const [dec, setDec] = useState({ text: '', owner: '', due: addDays(today, 2) })

  const addDecision = () => {
    if (!dec.text.trim() || !dec.owner.trim()) return
    const d: Decision = { id: uid('dec'), text: dec.text.trim(), owner: dec.owner.trim(), due: dec.due, done: false }
    upd(m, { decisions: [...m.decisions, d] })
    setDec({ text: '', owner: '', due: addDays(today, 2) })
  }
  const toggle = (id: string) =>
    upd(m, { decisions: m.decisions.map(d => d.id === id ? { ...d, done: !d.done, doneAt: !d.done ? today : undefined } : d) })

  return (
    <Modal title={`${MEETING_DEF[m.kind].name} — ${fmtDateFull(m.date)}`} onClose={onClose}>
      <div className="stack">
        <div className="row">
          <Text label="Chair" value={m.chair} onChange={v => upd(m, { chair: v })} />
          <Text label="Attendees" value={m.attendees} onChange={v => upd(m, { attendees: v })} placeholder="Names present" />
          <button className="btn noprint" onClick={() => window.print()}><Printer size={13} /> Print</button>
        </div>

        <label className="field">
          <span className="lbl">Agenda — assembled from live state, editable</span>
          <textarea className="in" style={{ minHeight: 150, fontSize: 13 }} value={m.notes} onChange={e => upd(m, { notes: e.target.value })} />
        </label>

        <div>
          <div className="lbl" style={{ marginBottom: 6 }}>Decisions — a meeting without these was a chat</div>
          <div className="stack" style={{ gap: 5 }}>
            {m.decisions.map(d => (
              <label key={d.id} className="check" style={{ background: 'var(--panel2)', padding: '7px 10px', borderRadius: 3 }}>
                <input type="checkbox" checked={d.done} onChange={() => toggle(d.id)} />
                <span style={{ flex: 1 }}>
                  <span style={{ textDecoration: d.done ? 'line-through' : undefined }}>{d.text}</span>
                  <span className="small dim" style={{ display: 'block' }}>{d.owner} · due {fmtDate(d.due)}{!d.done && d.due <= today ? ' — PAST DUE' : ''}</span>
                </span>
              </label>
            ))}
            {m.decisions.length === 0 && <div className="empty">No decisions recorded yet.</div>}
          </div>
          <div className="formrow noprint" style={{ marginTop: 8 }}>
            <Text label="Decision" value={dec.text} onChange={v => setDec(s => ({ ...s, text: v }))} placeholder="What was decided — specific enough to check" />
            <Text label="Owner" value={dec.owner} onChange={v => setDec(s => ({ ...s, owner: v }))} placeholder="One name" />
            <Text label="Due" value={dec.due} onChange={v => setDec(s => ({ ...s, due: v }))} />
            <button className="btn" onClick={addDecision}>Add</button>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className={`btn ${m.closed ? '' : 'primary'}`} onClick={() => upd(m, { closed: !m.closed })}>
            <CheckCircle2 size={14} /> {m.closed ? 'Reopen' : 'Close the meeting'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
