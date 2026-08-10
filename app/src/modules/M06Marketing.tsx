import React, { useMemo, useState } from 'react'
import { Plus, ShieldCheck, ShieldX } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Text, Select, Modal, useFlash } from '../components/ui'
import { inr, inrC, num, todayISO, uid, fmtDate } from '../lib/format'
import { PREFLIGHT_CHECKS, type Creative } from '../model/types'
import { sprintCal, sprintWeekOf } from '../model/engine'

export default function M06() {
  const { cfg, data, setData } = useStore()
  const [editing, setEditing] = useState<Creative | null>(null)
  const [flash, setFlash] = useFlash()
  const today = todayISO()

  const cal = sprintCal(cfg, today)
  const spendSprint = useMemo(() => Object.values(data.daily).filter(l => l.date >= cal.start && l.date <= cal.end).reduce((s, l) => s + Object.values(l.spend).reduce((a, v) => a + (v || 0), 0), 0), [data.daily, cal])
  const week = sprintWeekOf(cfg, cal.today)
  const tranche = cfg.spendRampMonthly.find(t => week <= t.uptoWeek) ?? cfg.spendRampMonthly.at(-1)!

  const queue = data.creatives.filter(c => c.status === 'preflight')
  const live = data.creatives.filter(c => c.status === 'live')

  const newCreative = () => setEditing({
    id: uid('cr'), name: '', channelId: 'meta', brand: 'education', lang: 'hi', angle: '',
    status: 'draft', checks: PREFLIGHT_CHECKS.map(() => false), createdAt: today,
  })

  const save = (c: Creative) => {
    setData(d => ({ ...d, creatives: d.creatives.some(x => x.id === c.id) ? d.creatives.map(x => x.id === c.id ? c : x) : [c, ...d.creatives] }))
    setEditing(null)
  }

  const decide = (c: Creative, approve: boolean, approver: string) => {
    const allPass = c.checks.every(Boolean)
    if (approve && !allPass) { setFlash('Cannot approve: every pre-flight rule must be ticked true.'); return }
    save({ ...c, status: approve ? 'approved' : 'rejected', approver, approvedAt: new Date().toISOString() })
    setFlash(approve ? 'Approved — recorded with name and timestamp.' : 'Rejected — recorded.')
  }

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="Spend — sprint to date" value={inrC(spendSprint)} sub={`this week's tranche ≈ ${inrC(tranche.monthly)}/mo — spend ramps with collections, never ahead of them`} />
            <Stat label="Pre-flight queue" value={num(queue.length)} tone={queue.length > 0 ? 'bad' : undefined} sub="nothing goes live from here" />
            <Stat label="Live creatives" value={num(live.length)} sub={`${data.creatives.length} in library`} />
          </div>
          <button className="btn primary noprint" onClick={newCreative}><Plus size={14} /> New creative</button>
        </div>
        {flash && <div className="note" style={{ marginTop: 8 }}>{flash}</div>}
      </Panel>

      <Panel span={12} title="Creative library — every asset carries its approval record and its numbers">
        <DataTable
          csvName="creative_library"
          cols={[
            { h: 'Creative', render: (c: Creative) => <button className="linkish" onClick={() => setEditing(c)}>{c.name || '(untitled)'}</button>, csv: c => c.name },
            { h: 'Brand', render: c => <Pill kind={c.brand === 'research' ? 'acc' : 'plain'}>{c.brand}</Pill>, csv: c => c.brand },
            { h: 'Channel', render: c => cfg.channels.find(x => x.id === c.channelId)?.name.split(' (')[0] ?? c.channelId, csv: c => c.channelId },
            { h: 'Lang', render: c => c.lang, csv: c => c.lang },
            { h: 'Angle', render: c => <span className="small">{c.angle}</span>, csv: c => c.angle },
            {
              h: 'Status', render: c => {
                const kind = c.status === 'live' ? 'good' : c.status === 'approved' ? 'acc' : c.status === 'preflight' ? 'warn' : c.status === 'rejected' ? 'crit' : 'plain'
                return <Pill kind={kind}>{c.status}</Pill>
              }, csv: c => c.status,
            },
            { h: 'Approval', render: c => c.approver ? <span className="small mono">{c.approver} · {c.approvedAt?.slice(0, 16).replace('T', ' ')}</span> : <span className="faint">—</span>, csv: c => c.approver ? `${c.approver} ${c.approvedAt}` : '' },
            { h: 'Spend', num: true, render: c => (c.spend ? inrC(c.spend) : '—'), csv: c => c.spend ?? '' },
            { h: 'Leads', num: true, render: c => (c.leads ? num(c.leads) : '—'), csv: c => c.leads ?? '' },
            { h: 'CPL', num: true, render: c => (c.spend && c.leads ? inr(Math.round(c.spend / c.leads)) : '—'), csv: c => c.spend && c.leads ? Math.round(c.spend / c.leads) : '' },
          ]}
          rows={data.creatives}
          empty="No creatives yet. Every ad starts here, passes pre-flight, and only then goes live."
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>Archive rule: creatives and their approval records are retained 7 years. Delete nothing — archive instead. Winners get cloned from the same angle tag; losers get one line on why before archiving.</p>
      </Panel>

      <Panel span={12} title="Production quota — weekly">
        <div className="row" style={{ gap: 22 }}>
          <Stat label="Statics" value="12" sub="per week" />
          <Stat label="Video hooks" value="8" sub="per week" />
          <Stat label="Long-form" value="4" sub="12–18 min, analyst-fronted" />
          <Stat label="Shorts" value="20" sub="per week" />
          <span className="small dim" style={{ maxWidth: 420 }}>Organic target: 30% of leads by Day 60, 45% by Day 120 — the insurance policy against a platform ban. Owned channels (WhatsApp API with DLT + opt-in, Telegram, email) cannot be taken away.</span>
        </div>
      </Panel>

      {editing && (
        <Modal title={editing.name ? `Creative — ${editing.name}` : 'New creative'} onClose={() => setEditing(null)}>
          <CreativeForm c={editing} onSave={save} onDecide={decide} />
        </Modal>
      )}
    </div>
  )
}

function CreativeForm({ c, onSave, onDecide }: { c: Creative; onSave: (c: Creative) => void; onDecide: (c: Creative, ok: boolean, approver: string) => void }) {
  const { cfg } = useStore()
  const [v, setV] = useState<Creative>(c)
  const [approver, setApprover] = useState('')
  const allPass = v.checks.every(Boolean)
  return (
    <div className="stack">
      <div className="formrow">
        <Text label="Name" value={v.name} onChange={x => setV(s => ({ ...s, name: x }))} placeholder="e.g. H-014 'Chai ke paise' hook" />
        <Select label="Brand (separate accounts!)" value={v.brand} onChange={x => setV(s => ({ ...s, brand: x as Creative['brand'] }))} options={[['education', 'Education brand'], ['research', 'Research brand (full RA Ad Code)']]} />
        <Select label="Channel" value={v.channelId} onChange={x => setV(s => ({ ...s, channelId: x }))} options={cfg.channels.filter(x => x.paid).map(x => [x.id, x.name.split(' (')[0]])} />
        <Select label="Language" value={v.lang} onChange={x => setV(s => ({ ...s, lang: x as Creative['lang'] }))} options={[['hi', 'Hindi'], ['en', 'English'], ['hi-en', 'Hinglish']]} />
      </div>
      <Text label="Hook / angle" value={v.angle} onChange={x => setV(s => ({ ...s, angle: x }))} placeholder="curiosity / process-credibility / founder-story…" />
      <div>
        <div className="lbl" style={{ marginBottom: 6 }}>Pre-flight — every line must be true before approval</div>
        <div className="stack" style={{ gap: 5 }}>
          {PREFLIGHT_CHECKS.map((label, i) => (
            <label key={i} className="check">
              <input type="checkbox" checked={v.checks[i] ?? false} onChange={e => setV(s => { const checks = [...s.checks]; checks[i] = e.target.checked; return { ...s, checks } })} />
              <span className="small">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="formrow">
        <Text label="Spend to date ₹ (optional)" value={String(v.spend ?? '')} onChange={x => setV(s => ({ ...s, spend: parseFloat(x) || undefined }))} />
        <Text label="Leads to date (optional)" value={String(v.leads ?? '')} onChange={x => setV(s => ({ ...s, leads: parseFloat(x) || undefined }))} />
      </div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
          <Text label="Approver (Compliance / Marketing Head)" value={approver} onChange={setApprover} placeholder="Name — recorded" />
          <button className="btn" disabled={!approver || v.status === 'live'} onClick={() => onDecide(v, true, approver)} title={allPass ? '' : 'All checks must pass'}>
            <ShieldCheck size={14} /> Approve
          </button>
          <button className="btn danger" disabled={!approver} onClick={() => onDecide(v, false, approver)}><ShieldX size={14} /> Reject</button>
        </div>
        <div className="row">
          <Select value={v.status} onChange={x => setV(s => ({ ...s, status: x as Creative['status'] }))}
            options={[['draft', 'Draft'], ['preflight', 'Send to pre-flight'], ['approved', 'Approved'], ['live', 'Live'], ['archived', 'Archived'], ['rejected', 'Rejected']]} />
          <button className="btn primary" onClick={() => onSave(v.status === 'live' && !(c.status === 'live') && !(v.approver || approver) ? { ...v, status: 'preflight' } : v)}>Save</button>
        </div>
      </div>
      {v.status !== 'approved' && v.status !== 'live' && !allPass && <p className="small dim" style={{ margin: 0 }}>Approval stays locked until all {PREFLIGHT_CHECKS.length} rules are ticked. "Live" without an approval record will bounce back to pre-flight on save.</p>}
    </div>
  )
}
