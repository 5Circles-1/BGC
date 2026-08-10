import React, { useMemo, useState } from 'react'
import { Plus, Lock, Unlock, ShieldCheck } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Text, Select, Tabs, Modal, useFlash, Num } from '../components/ui'
import { inr, inrC, num, todayISO, uid, fmtDate } from '../lib/format'
import { familyCapStatus, paymentLinkGate } from '../model/engine'
import { AGENTS } from '../model/content'
import type { Family, ClientCompliance, SignalBatch, Grievance, ProductId } from '../model/types'

export default function M09() {
  const [tab, setTab] = useState('cap')
  return (
    <div className="grid">
      <Panel span={12}>
        <Tabs on={tab} set={setTab} tabs={[
          ['cap', 'Fee-cap ledger'], ['kyc', 'KYC & access gates'], ['signoff', 'Analyst sign-off'],
          ['adreg', 'Ad approval register'], ['griev', 'Grievances / SCORES'], ['cal', 'Regulatory calendar'], ['ai', 'AI-use register'],
        ]} />
        {tab === 'cap' && <FeeCap />}
        {tab === 'kyc' && <Kyc />}
        {tab === 'signoff' && <SignOff />}
        {tab === 'adreg' && <AdRegister />}
        {tab === 'griev' && <Grievances />}
        {tab === 'cal' && <RegCalendar />}
        {tab === 'ai' && <AiRegister />}
      </Panel>
    </div>
  )
}

// ---------- Fee-cap ledger ----------

function FeeCap() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const [flash, setFlash] = useFlash()
  const [addingFam, setAddingFam] = useState(false)
  const [famForm, setFamForm] = useState({ code: '', label: '', members: 1 })
  const [charge, setCharge] = useState<{ famId: string; productId: ProductId; amount: number } | null>(null)

  const statuses = useMemo(() => data.families.map(f => familyCapStatus(cfg, f, today)), [cfg, data.families, today])
  const breached = statuses.filter(s => s.breached).length

  const addFamily = () => {
    if (!famForm.code.trim()) return
    const f: Family = { id: uid('fam'), code: famForm.code.trim().toUpperCase(), label: famForm.label, members: famForm.members, accredited: false, charges: [] }
    setData(d => ({ ...d, families: [...d.families, f] }))
    setAddingFam(false); setFamForm({ code: '', label: '', members: 1 })
  }

  const tryCharge = () => {
    if (!charge) return
    const fam = data.families.find(f => f.id === charge.famId)
    if (!fam) return
    const gate = paymentLinkGate(cfg, fam, charge.productId, charge.amount, today)
    if (!gate.allowed) {
      setFlash(`BLOCKED — ${gate.reasons.join(' ')}`)
      return
    }
    setData(d => ({
      ...d, families: d.families.map(f => f.id === fam.id
        ? { ...f, charges: [...f.charges, { id: uid('chg'), date: today, productId: charge.productId, amountInclGst: charge.amount }] }
        : f),
    }))
    setFlash(`Allowed — charge recorded. Headroom after: ${inr(Math.round(gate.headroomAfter))} ex-GST.`)
    setCharge(null)
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 26 }}>
          <Stat label="Families on ledger" value={num(data.families.length)} sub="codes only — client PII stays in the CRM" />
          <Stat label="Cap per family / year" value={inr(cfg.feeCap.capPerFamilyYear)} sub="individuals & HUF, research services, ex-GST, rolling 12 months" />
          <Stat label="Breaches" value={num(breached)} tone={breached ? 'bad' : 'good'} sub={breached ? 'stop billing — Compliance Officer, today' : 'none'} />
        </div>
        <button className="btn primary noprint" onClick={() => setAddingFam(true)}><Plus size={14} /> Add family</button>
      </div>
      {flash && <div className={`note ${flash.startsWith('BLOCKED') ? 'crit' : 'good'}`}>{flash}</div>}
      <DataTable
        csvName="fee_cap_ledger"
        cols={[
          { h: 'Family code', render: (s: typeof statuses[number]) => <strong className="mono">{s.family.code}</strong>, csv: s => s.family.code },
          { h: 'Label', render: s => <span className="small dim">{s.family.label || '—'}</span>, csv: s => s.family.label },
          { h: 'Members', num: true, render: s => s.family.members, csv: s => s.family.members },
          { h: 'Charges', num: true, render: s => s.family.charges.length, csv: s => s.family.charges.length },
          { h: 'Used (ex-GST, 12m)', num: true, render: s => inr(Math.round(s.usedExGst)), csv: s => Math.round(s.usedExGst) },
          { h: 'Headroom', num: true, render: s => <span className={s.breached ? 'delta-bad' : s.headroom < 30000 ? '' : 'delta-good'}>{inr(Math.round(s.headroom))}</span>, csv: s => Math.round(s.headroom) },
          { h: 'State', render: s => s.breached ? <Pill kind="crit">over cap</Pill> : s.headroom < 30000 ? <Pill kind="warn">near cap</Pill> : <Pill kind="good">ok</Pill>, csv: s => s.breached ? 'breach' : 'ok' },
          { h: '', render: s => <button className="btn sm noprint" onClick={() => setCharge({ famId: s.family.id, productId: 'p3', amount: cfg.products.find(p => p.id === 'p3')!.priceInclGst })}>Test / record charge</button> },
        ]}
        rows={statuses}
        empty="Add a family code before the first research-service invoice. Education products sit outside the cap; Scanner Pro and Research count against it."
      />
      <p className="small dim" style={{ margin: 0 }}>
        This is the gate the brief mandates: the check runs BEFORE the payment link exists. Advance fees beyond {cfg.feeCap.advanceMaxMonths} months are blocked outright; premature termination refunds pro-rata with zero breakage (calculator in Finance).
      </p>

      {addingFam && (
        <Modal title="Add family (code only — no PII)" onClose={() => setAddingFam(false)}>
          <div className="stack">
            <div className="formrow">
              <Text label="Family code" value={famForm.code} onChange={v => setFamForm(s => ({ ...s, code: v }))} placeholder="e.g. FAM-0042" />
              <Text label="Internal label (optional)" value={famForm.label} onChange={v => setFamForm(s => ({ ...s, label: v }))} placeholder="CRM reference" />
              <Num label="Members" value={famForm.members} onChange={v => setFamForm(s => ({ ...s, members: v }))} />
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={addFamily}>Add</button></div>
          </div>
        </Modal>
      )}
      {charge && (
        <Modal title="Payment-link gate — test & record" onClose={() => setCharge(null)}>
          <div className="stack">
            <div className="formrow">
              <Select label="Product" value={charge.productId} onChange={v => {
                const p = cfg.products.find(x => x.id === v)!
                setCharge(s => s && ({ ...s, productId: v as ProductId, amount: p.priceInclGst }))
              }} options={cfg.products.map(p => [p.id, `${p.short} — ${inr(p.priceInclGst)}${p.countsTowardCap ? ' (counts toward cap)' : ''}`])} />
              <Num label="Amount incl. GST ₹" value={charge.amount} onChange={v => setCharge(s => s && ({ ...s, amount: v }))} />
            </div>
            {(() => {
              const fam = data.families.find(f => f.id === charge.famId)!
              const gate = paymentLinkGate(cfg, fam, charge.productId, charge.amount, today)
              return (
                <div className={`note ${gate.allowed ? 'good' : 'crit'}`}>
                  {gate.allowed
                    ? <span><ShieldCheck size={13} style={{ verticalAlign: -2 }} /> Link may be generated. Headroom after this charge: {inr(Math.round(gate.headroomAfter))} ex-GST.</span>
                    : <span>Link generation blocked: {gate.reasons.join(' ')}</span>}
                </div>
              )
            })()}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn primary" onClick={tryCharge}>Record charge (runs the gate)</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---------- KYC & access gates ----------

function Kyc() {
  const { data, setData } = useStore()
  const today = todayISO()
  const [code, setCode] = useState('')
  const [flash, setFlash] = useFlash()

  const add = () => {
    if (!code.trim()) return
    const c: ClientCompliance = { id: uid('cl'), code: code.trim().toUpperCase(), kyc: false, agreement: false, riskProfile: false, products: ['p2c'], provisioned: false, updatedAt: today }
    setData(d => ({ ...d, clients: [...d.clients, c] }))
    setCode('')
  }
  const toggle = (c: ClientCompliance, k: 'kyc' | 'agreement' | 'riskProfile') =>
    setData(d => ({ ...d, clients: d.clients.map(x => x.id === c.id ? { ...x, [k]: !x[k], updatedAt: today } : x) }))
  const provision = (c: ClientCompliance) => {
    if (!(c.kyc && c.agreement && c.riskProfile)) {
      setFlash('BLOCKED — access cannot be provisioned until KYC, agreement and risk profile are all complete. No manual override without the Compliance Officer.')
      return
    }
    setData(d => ({ ...d, clients: d.clients.map(x => x.id === c.id ? { ...x, provisioned: !x.provisioned, updatedAt: today } : x) }))
  }
  const ready = data.clients.filter(c => c.kyc && c.agreement && c.riskProfile)

  return (
    <div className="stack">
      <div className="row" style={{ gap: 26 }}>
        <Stat label="Research-service clients" value={num(data.clients.length)} sub="Scanner Pro / Research Subscription — by code, no PII" />
        <Stat label="Cleared all three gates" value={num(ready.length)} tone={ready.length === data.clients.length && data.clients.length > 0 ? 'good' : undefined} />
        <Stat label="Provisioned" value={num(data.clients.filter(c => c.provisioned).length)} />
      </div>
      {flash && <div className="note crit">{flash}</div>}
      <div className="formrow noprint">
        <Text label="Client code" value={code} onChange={setCode} placeholder="e.g. CLT-0107" />
        <button className="btn primary" onClick={add}><Plus size={14} /> Add client</button>
      </div>
      <DataTable
        csvName="kyc_gates"
        cols={[
          { h: 'Client', render: (c: ClientCompliance) => <strong className="mono">{c.code}</strong>, csv: c => c.code },
          { h: 'KYC', render: c => <button className="btn sm" style={{ color: c.kyc ? 'var(--s-good)' : 'var(--s-crit)' }} onClick={() => toggle(c, 'kyc')}>{c.kyc ? '✓' : '✗'}</button>, csv: c => c.kyc ? 'yes' : 'no' },
          { h: 'Agreement', render: c => <button className="btn sm" style={{ color: c.agreement ? 'var(--s-good)' : 'var(--s-crit)' }} onClick={() => toggle(c, 'agreement')}>{c.agreement ? '✓' : '✗'}</button>, csv: c => c.agreement ? 'yes' : 'no' },
          { h: 'Risk profile', render: c => <button className="btn sm" style={{ color: c.riskProfile ? 'var(--s-good)' : 'var(--s-crit)' }} onClick={() => toggle(c, 'riskProfile')}>{c.riskProfile ? '✓' : '✗'}</button>, csv: c => c.riskProfile ? 'yes' : 'no' },
          {
            h: 'Access', render: c => (
              <button className={`btn sm ${c.provisioned ? '' : 'primary'}`} onClick={() => provision(c)}>
                {c.provisioned ? <><Unlock size={12} /> provisioned</> : <><Lock size={12} /> provision</>}
              </button>
            ), csv: c => c.provisioned ? 'provisioned' : 'locked',
          },
          { h: 'Updated', render: c => <span className="small dim">{fmtDate(c.updatedAt)}</span>, csv: c => c.updatedAt },
        ]}
        rows={data.clients}
        empty="Every Scanner Pro / Research client enters here at sale. The provision button physically refuses until all three gates are green."
      />
    </div>
  )
}

// ---------- Analyst sign-off ----------

function SignOff() {
  const { data, setData } = useStore()
  const today = todayISO()
  const [form, setForm] = useState({ title: '', items: 5, product: 'p2c' as 'p2c' | 'p3' })
  const [analyst, setAnalyst] = useState('')
  const [flash, setFlash] = useFlash()

  const add = () => {
    if (!form.title.trim()) return
    const b: SignalBatch = { id: uid('sig'), date: today, title: form.title.trim(), items: form.items, product: form.product, status: 'awaiting_signoff' }
    setData(d => ({ ...d, signals: [b, ...d.signals] }))
    setForm(s => ({ ...s, title: '' }))
  }
  const sign = (b: SignalBatch, approve: boolean) => {
    if (!analyst.trim()) { setFlash('Sign-off requires the registered analyst\'s name — it is logged with the timestamp.'); return }
    setData(d => ({
      ...d, signals: d.signals.map(x => x.id === b.id
        ? { ...x, status: approve ? 'approved' : 'rejected', analyst: analyst.trim(), signedAt: new Date().toISOString() }
        : x),
    }))
  }
  const release = (b: SignalBatch) => {
    if (b.status !== 'approved') { setFlash('Release is blocked until a registered analyst has approved the batch.'); return }
    setData(d => ({ ...d, signals: d.signals.map(x => x.id === b.id ? { ...x, status: 'released', releasedAt: new Date().toISOString() } : x) }))
  }

  return (
    <div className="stack">
      <div className="note warn small">
        AI drafts; humans approve. SEBI places responsibility for research services solely on the RA regardless of AI usage — so no signal, call or report reaches a client without a registered analyst's name and timestamp on it. The release button below is physically gated on approval. Ask the Compliance Officer, in writing, whether signal delivery touches the algo-trading framework before Scanner Pro scales.
      </div>
      {flash && <div className="note crit">{flash}</div>}
      <div className="formrow noprint">
        <Text label="Batch title" value={form.title} onChange={v => setForm(s => ({ ...s, title: v }))} placeholder="e.g. 2026-08-12 morning batch" />
        <Num label="Items" value={form.items} onChange={v => setForm(s => ({ ...s, items: v }))} />
        <Select label="Service" value={form.product} onChange={v => setForm(s => ({ ...s, product: v as 'p2c' | 'p3' }))} options={[['p2c', 'Scanner Pro'], ['p3', 'Research Subscription']]} />
        <button className="btn primary" onClick={add}><Plus size={14} /> Queue batch</button>
        <Text label="Signing analyst (registered)" value={analyst} onChange={setAnalyst} placeholder="Name — recorded on every action" />
      </div>
      <DataTable
        csvName="signoff_register"
        cols={[
          { h: 'Date', render: (b: SignalBatch) => fmtDate(b.date), csv: b => b.date },
          { h: 'Batch', render: b => <strong>{b.title}</strong>, csv: b => b.title },
          { h: 'Service', render: b => b.product === 'p2c' ? 'Scanner Pro' : 'Research', csv: b => b.product },
          { h: 'Items', num: true, render: b => b.items, csv: b => b.items },
          {
            h: 'Status', render: b => {
              const kind = b.status === 'released' ? 'good' : b.status === 'approved' ? 'acc' : b.status === 'awaiting_signoff' ? 'warn' : b.status === 'rejected' ? 'crit' : 'plain'
              return <Pill kind={kind}>{b.status.replace('_', ' ')}</Pill>
            }, csv: b => b.status,
          },
          { h: 'Analyst · time', render: b => b.analyst ? <span className="small mono">{b.analyst} · {b.signedAt?.slice(0, 16).replace('T', ' ')}</span> : <span className="faint">—</span>, csv: b => b.analyst ? `${b.analyst} ${b.signedAt}` : '' },
          {
            h: '', render: b => (
              <span className="row noprint" style={{ gap: 5 }}>
                {b.status === 'awaiting_signoff' && <><button className="btn sm" onClick={() => sign(b, true)}>Approve</button><button className="btn sm danger" onClick={() => sign(b, false)}>Reject</button></>}
                {b.status === 'approved' && <button className="btn sm primary" onClick={() => release(b)}>Release to clients</button>}
              </span>
            ),
          },
        ]}
        rows={data.signals}
        empty="Signal batches queue here. Draft → analyst sign-off (blocking) → release. The queue is the compliance record."
      />
    </div>
  )
}

// ---------- Ad approval register (view over creatives) ----------

function AdRegister() {
  const { data } = useStore()
  const rows = data.creatives.filter(c => c.approver)
  return (
    <div className="stack">
      <p className="small dim" style={{ margin: 0 }}>Every approval/rejection recorded in Marketing lands here automatically — approver, timestamp, brand, channel. Retain 7 years alongside the creative itself.</p>
      <DataTable
        csvName="ad_approval_register"
        cols={[
          { h: 'Creative', render: (c: typeof rows[number]) => c.name, csv: c => c.name },
          { h: 'Brand', render: c => c.brand, csv: c => c.brand },
          { h: 'Decision', render: c => <Pill kind={c.status === 'rejected' ? 'crit' : 'good'}>{c.status === 'rejected' ? 'rejected' : 'approved'}</Pill>, csv: c => c.status },
          { h: 'Approver', render: c => c.approver, csv: c => c.approver ?? '' },
          { h: 'Timestamp', render: c => <span className="mono small">{c.approvedAt?.slice(0, 19).replace('T', ' ')}</span>, csv: c => c.approvedAt ?? '' },
        ]}
        rows={rows}
        empty="No approvals recorded yet — they appear the moment Marketing's pre-flight decides a creative."
      />
    </div>
  )
}

// ---------- Grievances ----------

function Grievances() {
  const { data, setData } = useStore()
  const today = todayISO()
  const [g, setG] = useState({ summary: '', channel: 'direct' as 'direct' | 'SCORES', days: 21 })
  const add = () => {
    if (!g.summary.trim()) return
    const item: Grievance = { id: uid('gr'), openedAt: today, channel: g.channel, summary: g.summary.trim(), status: 'open', dueAt: addDaysLocal(today, g.days) }
    setData(d => ({ ...d, grievances: [item, ...d.grievances] }))
    setG(s => ({ ...s, summary: '' }))
  }
  const overdue = data.grievances.filter(x => x.status === 'open' && x.dueAt <= today).length
  return (
    <div className="stack">
      <div className="row" style={{ gap: 26 }}>
        <Stat label="Open" value={num(data.grievances.filter(x => x.status === 'open').length)} />
        <Stat label="Past due" value={num(overdue)} tone={overdue ? 'bad' : 'good'} sub="regulatory clocks — SCORES timelines are hard deadlines" />
      </div>
      <div className="formrow noprint">
        <Text label="Summary (no PII)" value={g.summary} onChange={v => setG(s => ({ ...s, summary: v }))} placeholder="e.g. CLT-0107 alleges promised returns on sales call" />
        <Select label="Channel" value={g.channel} onChange={v => setG(s => ({ ...s, channel: v as 'direct' | 'SCORES' }))} options={[['direct', 'Direct'], ['SCORES', 'SCORES']]} />
        <Num label="Clock (days)" value={g.days} onChange={v => setG(s => ({ ...s, days: v }))} />
        <button className="btn primary" onClick={add}><Plus size={14} /> Log</button>
      </div>
      <DataTable
        csvName="grievances"
        cols={[
          { h: 'Opened', render: (x: Grievance) => fmtDate(x.openedAt), csv: x => x.openedAt },
          { h: 'Channel', render: x => <Pill kind={x.channel === 'SCORES' ? 'serious' : 'plain'}>{x.channel}</Pill>, csv: x => x.channel },
          { h: 'Summary', render: x => x.summary, csv: x => x.summary },
          { h: 'Due', render: x => <span className={x.status === 'open' && x.dueAt <= today ? 'delta-bad mono' : 'mono'}>{fmtDate(x.dueAt)}</span>, csv: x => x.dueAt },
          { h: 'Status', render: x => <Pill kind={x.status === 'open' ? 'warn' : 'good'}>{x.status}</Pill>, csv: x => x.status },
          { h: '', render: x => x.status === 'open' ? <button className="btn sm noprint" onClick={() => setData(d => ({ ...d, grievances: d.grievances.map(y => y.id === x.id ? { ...y, status: 'resolved', closedAt: today } : y) }))}>Resolve</button> : null },
        ]}
        rows={data.grievances}
        empty="Mis-selling complaints route here immediately — they are the leading indicator of the thing that suspends registrations."
      />
    </div>
  )
}

function addDaysLocal(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// ---------- Regulatory calendar & retention ----------

const REG_CAL = [
  ['Day 1', 'SI-Portal contact registration; Meta SEBI advertiser verification; Google India FS verification — submitted'],
  ['Week 1', 'First ad batch through pre-flight with full RA Ad Code fields; Compliance Officer confirms fee-cap ledger live'],
  ['Weekly (Fri)', 'Call-recording sample audit against rubric; breach register reviewed'],
  ['Monthly', 'Grievance summary; AI-use register review; fee-cap near-limit report; GST filing per Finance calendar'],
  ['Quarterly', 'RAASB/SEBI reporting calendar per Compliance Officer; client-agreement completeness audit'],
  ['Continuous', 'Advance fees ≤ 12 months; refunds pro-rata zero-breakage; education/research segregation (brands, books, ad accounts); records retention 5y (7y for ads)'],
] as const

function RegCalendar() {
  return (
    <div className="stack">
      <DataTable
        cols={[
          { h: 'When', render: (r: readonly [string, string]) => <strong>{r[0]}</strong>, csv: r => r[0] },
          { h: 'Obligation', render: r => r[1], csv: r => r[1] },
        ]}
        rows={[...REG_CAL]}
        csvName="reg_calendar"
      />
      <p className="small dim" style={{ margin: 0 }}>Dates marked by the Compliance Officer against the firm's actual filing calendar — this table is the checklist, not legal advice. Verify each item against current SEBI circulars.</p>
    </div>
  )
}

// ---------- AI-use register ----------

function AiRegister() {
  const { data } = useStore()
  const gated = AGENTS.filter(a => a.gate !== 'none')
  return (
    <div className="stack">
      <p className="small dim" style={{ margin: 0 }}>
        The standing register the brief requires: where AI is used, its limits, and the human gate. Responsibility for research services sits with the RA irrespective of AI usage — this register is disclosed to clients where applicable.
      </p>
      <DataTable
        csvName="ai_register"
        cols={[
          { h: 'Agent', render: (a: typeof AGENTS[number]) => <strong>{a.name}</strong>, csv: a => a.name },
          { h: 'Function', render: a => a.fn, csv: a => a.fn },
          { h: 'What it may do', render: a => <span className="small">{a.job}</span>, csv: a => a.job },
          { h: 'Human gate', render: a => a.gate === 'blocking' ? <Pill kind="crit">blocking — {a.gateBy}</Pill> : a.gate === 'review' ? <Pill kind="warn">review — {a.gateBy}</Pill> : <Pill kind="plain">autonomous (non-client-facing)</Pill>, csv: a => `${a.gate}${a.gateBy ? ` (${a.gateBy})` : ''}` },
          { h: 'Runs logged', num: true, render: a => data.agents[a.id]?.runs.length ?? 0, csv: a => data.agents[a.id]?.runs.length ?? 0 },
        ]}
        rows={AGENTS}
      />
      <p className="small dim" style={{ margin: 0 }}>{gated.length} of {AGENTS.length} agents carry a human gate. The hard rule everywhere: no AI generates, approves or transmits a securities recommendation — analyst sign-off is a blocking gate, not a checkbox.</p>
    </div>
  )
}
