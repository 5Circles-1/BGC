import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Text, Select, Num } from '../components/ui'
import { num, todayISO, uid, fmtDate, diffDays } from '../lib/format'
import type { Ticket } from '../model/types'

export default function M11() {
  const { data, setData } = useStore()
  const today = todayISO()
  const [t, setT] = useState({ type: 'access', priority: 'P2' as Ticket['priority'], slaHours: 24 })

  const open = data.tickets.filter(x => x.status === 'open')
  const breach = open.filter(x => hoursSince(x.openedAt) > x.slaHours)

  const add = () => {
    const item: Ticket = { id: uid('tk'), openedAt: new Date().toISOString(), type: t.type, priority: t.priority, status: 'open', slaHours: t.slaHours }
    setData(d => ({ ...d, tickets: [item, ...d.tickets] }))
  }

  const researchClients = data.clients.filter(c => c.products.some(p => p === 'p2c' || p === 'p3'))
  const gated = researchClients.filter(c => !(c.kyc && c.agreement && c.riskProfile))

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ gap: 26 }}>
          <Stat label="Open tickets" value={num(open.length)} sub={`${data.tickets.length} total logged`} />
          <Stat label="SLA breaches" value={num(breach.length)} tone={breach.length ? 'bad' : 'good'} sub="P1 4h · P2 24h · P3 72h" />
          <Stat label="Research clients blocked at gates" value={num(gated.length)} tone={gated.length ? 'bad' : 'good'} sub="KYC / agreement / risk profile — chase in Compliance Vault" />
        </div>
      </Panel>

      <Panel span={12} title="Onboarding funnel — research services (education provisions instantly)">
        <div className="twrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(110px, 1fr))', gap: 6 }}>
          {[
            ['Paid', researchClients.length],
            ['KYC done', researchClients.filter(c => c.kyc).length],
            ['Agreement signed', researchClients.filter(c => c.agreement).length],
            ['Risk profiled', researchClients.filter(c => c.riskProfile).length],
            ['Provisioned', researchClients.filter(c => c.provisioned).length],
          ].map(([label, count], i) => (
            <div key={i} className="panel" style={{ padding: '8px 10px', textAlign: 'center' }}>
              <div className="lbl" style={{ fontSize: 9.5 }}>{label}</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{count as number}</div>
            </div>
          ))}
          </div>
        </div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>The funnel narrows only left-to-right. If "Provisioned" ever exceeds the three gate columns, someone bypassed the gate — that is a compliance incident, not an ops shortcut.</p>
      </Panel>

      <Panel span={12} title="Support tickets">
        <div className="formrow noprint" style={{ marginBottom: 8 }}>
          <Select label="Type" value={t.type} onChange={v => setT(s => ({ ...s, type: v }))} options={[['access', 'Access'], ['payment', 'Payment'], ['refund', 'Refund'], ['doubt', 'Doubt group'], ['complaint', 'Complaint → also log in Compliance'], ['other', 'Other']]} />
          <Select label="Priority" value={t.priority} onChange={v => setT(s => ({ ...s, priority: v as Ticket['priority'], slaHours: v === 'P1' ? 4 : v === 'P2' ? 24 : 72 }))} options={[['P1', 'P1'], ['P2', 'P2'], ['P3', 'P3']]} />
          <Num label="SLA hours" value={t.slaHours} onChange={v => setT(s => ({ ...s, slaHours: v }))} />
          <button className="btn primary" onClick={add}><Plus size={14} /> Log ticket</button>
        </div>
        <DataTable
          csvName="tickets"
          cols={[
            { h: 'Opened', render: (x: Ticket) => <span className="mono small">{x.openedAt.slice(0, 16).replace('T', ' ')}</span>, csv: x => x.openedAt },
            { h: 'Type', render: x => x.type, csv: x => x.type },
            { h: 'Priority', render: x => <Pill kind={x.priority === 'P1' ? 'crit' : x.priority === 'P2' ? 'warn' : 'plain'}>{x.priority}</Pill>, csv: x => x.priority },
            { h: 'Age (h)', num: true, render: x => { const h = Math.round(hoursSince(x.openedAt)); return <span className={x.status === 'open' && h > x.slaHours ? 'delta-bad' : ''}>{x.status === 'open' ? h : '—'}</span> }, csv: x => Math.round(hoursSince(x.openedAt)) },
            { h: 'SLA', num: true, render: x => `${x.slaHours}h`, csv: x => x.slaHours },
            { h: 'Status', render: x => <Pill kind={x.status === 'open' ? 'warn' : 'good'}>{x.status}</Pill>, csv: x => x.status },
            { h: '', render: x => x.status === 'open' ? <button className="btn sm noprint" onClick={() => setData(d => ({ ...d, tickets: d.tickets.map(y => y.id === x.id ? { ...y, status: 'closed', closedAt: new Date().toISOString() } : y) }))}>Close</button> : null },
          ]}
          rows={data.tickets}
          empty="Tickets over 20/day for two days = the hiring trigger for +1 support head."
        />
      </Panel>

      <Panel span={12} title="Churn & renewal watch — P2/P3 subscriptions">
        <p className="small dim" style={{ margin: 0 }}>
          Weekly live market session for paying subscribers is the retention floor (cheap to run, materially cuts churn). Track scanner monthly→annual upgrades and P3 renewals here as they begin — log units in the Daily Ritual; renewals count as new collections on their date. Refunds within 30 days claw back incentives automatically in Finance.
        </p>
      </Panel>
    </div>
  )
}

function hoursSince(isoTs: string): number {
  return (Date.now() - new Date(isoTs).getTime()) / 3600000
}
