import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Text, Select, Num, Tabs, useFlash } from '../components/ui'
import { TrendLine } from '../components/charts'
import { inr, inrC, num, pct, todayISO, uid, fmtDate } from '../lib/format'
import { cashProjection, pacing, payrollForMonth, proRataRefund, sprintCal } from '../model/engine'
import type { ProductId, Refund } from '../model/types'

export default function M10() {
  const [tab, setTab] = useState('cash')
  return (
    <div className="grid">
      <Panel span={12}>
        <Tabs on={tab} set={setTab} tabs={[['cash', 'Cash & runway'], ['pnl', 'P&L plan'], ['payroll', 'Payroll & incentives'], ['refunds', 'Refunds & clawbacks']]} />
        {tab === 'cash' && <Cash />}
        {tab === 'pnl' && <Pnl />}
        {tab === 'payroll' && <Payroll />}
        {tab === 'refunds' && <Refunds />}
      </Panel>
    </div>
  )
}

function Cash() {
  const { cfg, setCfg, data } = useStore()
  const today = todayISO()
  const proj = useMemo(() => cashProjection(cfg, data, today), [cfg, data, today])
  const pace = useMemo(() => pacing(cfg, data, today), [cfg, data, today])
  const low = proj.minCash < 0

  return (
    <div className="stack">
      <div className="row" style={{ gap: 26 }}>
        <Stat label="Cash deployed (opening + WC)" value={inrC(cfg.cash.openingCash + cfg.cash.workingCapitalAvailable)} sub="edit below" />
        <Stat label="Projected minimum balance" value={inrC(proj.minCash)} tone={low ? 'bad' : 'good'}
          sub={low ? `goes negative on day ${proj.runwayDays} — raise WC or slow the spend ramp` : 'stays positive through the sprint'} />
        <Stat label="Collections vs plan (cumulative)" value={inrC(pace.actualCumToday)} sub={`required ${inrC(pace.requiredCumToday)} · ${pace.variance >= 0 ? 'ahead' : 'behind'} ${inrC(Math.abs(pace.variance))}`} />
      </div>
      <div className="note warn small">
        Working-capital warning (from the brief, surfaced permanently): you spend on ads and salaries in Month 1 to collect in Month 2. Reaching the ₹25L run-rate without a crunch takes ₹18–22L of working capital; the plan deploys ₹10–14L of it early. This chart is that sentence, drawn.
      </div>
      <TrendLine data={proj.points.map(p => ({ d: `D${p.day}`, cash: Math.round(p.cash) }))} xKey="d" yKey="cash" refY={0} refLabel="₹0" height={220} />
      <div className="formrow">
        <Num label="Opening cash ₹" value={cfg.cash.openingCash} step={50000} onChange={v => setCfg(c => ({ ...c, cash: { ...c.cash, openingCash: v } }))} />
        <Num label="Working capital available ₹" value={cfg.cash.workingCapitalAvailable} step={50000} onChange={v => setCfg(c => ({ ...c, cash: { ...c.cash, workingCapitalAvailable: v } }))} />
        <Num label="Runway alert (days)" value={cfg.cash.runwayAlertDays} onChange={v => setCfg(c => ({ ...c, cash: { ...c.cash, runwayAlertDays: v } }))} />
      </div>
      <p className="small dim" style={{ margin: 0 }}>Projection: actual collections and spend to date, then the forecast's weekly build-up; fixed opex (ex-marketing) prorated daily. Gateway-only for online money; cash receipts follow the Accounts Manual — growth capital must not enter a leaky bucket.</p>
    </div>
  )
}

function Pnl() {
  const { cfg, setCfg } = useStore()
  const total = cfg.opex.reduce((s, o) => s + o.monthly, 0)
  const target = cfg.target.monthlyRunRate
  return (
    <div className="stack">
      <div className="row" style={{ gap: 26 }}>
        <Stat label="Run-rate collections (plan)" value={inrC(target)} />
        <Stat label="Total opex (plan)" value={inrC(total)} sub={`${pct(total / target, 1)} of revenue`} />
        <Stat label="EBITDA at run-rate" value={inrC(target - total)} tone={target - total > 0 ? 'good' : 'bad'} sub={pct((target - total) / target, 1)} />
      </div>
      <DataTable
        csvName="pnl_plan"
        cols={[
          { h: 'Line', render: (o: typeof cfg.opex[number]) => o.name, csv: o => o.name },
          {
            h: 'Monthly ₹', num: true, render: (o) => (
              <span style={{ display: 'inline-block', width: 110 }}>
                <Num value={o.monthly} step={5000} onChange={v => setCfg(c => ({ ...c, opex: c.opex.map(x => x.name === o.name ? { ...x, monthly: v } : x) }))} />
              </span>
            ), csv: o => o.monthly,
          },
          { h: '% of revenue', num: true, render: o => pct(o.monthly / target, 1), csv: o => (o.monthly / target).toFixed(4) },
        ]}
        rows={cfg.opex}
        sumRow={['Total opex', inr(total), pct(total / target, 1)]}
      />
    </div>
  )
}

function Payroll() {
  const { cfg, data } = useStore()
  const [month, setMonth] = useState(todayISO().slice(0, 7))
  const rows = useMemo(() => payrollForMonth(cfg, data, month), [cfg, data, month])
  const total = rows.reduce((s, r) => s + r.total, 0)
  return (
    <div className="stack">
      <div className="formrow">
        <Text label="Month (YYYY-MM)" value={month} onChange={setMonth} />
        <Stat label="Floor payout this month" value={inrC(total)} sub="fixed + incentives − clawbacks, from logged sales" />
      </div>
      <DataTable
        csvName={`payroll_${month}`}
        cols={[
          { h: 'Rep', render: (r: typeof rows[number]) => <span><strong>{r.rep.name}</strong> <span className="faint small">({r.rep.desk})</span></span>, csv: r => r.rep.name },
          { h: 'Fixed', num: true, render: r => inr(r.fixed), csv: r => r.fixed },
          { h: 'P1 units', num: true, render: r => (r.rep.desk === 'A' ? num(r.p1Units) : '—'), csv: r => r.p1Units },
          { h: 'Scanner-yr units', num: true, render: r => (r.rep.desk === 'A' ? num(r.scannerAnnualUnits, 1) : '—'), csv: r => r.scannerAnnualUnits },
          { h: 'B collections', num: true, render: r => (r.rep.desk === 'B' ? inr(Math.round(r.bCollections)) : '—'), csv: r => Math.round(r.bCollections) },
          { h: 'Incentive', num: true, render: r => inr(Math.round(r.incentive)), csv: r => Math.round(r.incentive) },
          { h: 'Clawback', num: true, render: r => (r.clawback ? <span className="delta-bad">−{inr(Math.round(r.clawback))}</span> : '—'), csv: r => Math.round(r.clawback) },
          { h: 'Total', num: true, render: r => <strong>{inr(Math.round(r.total))}</strong>, csv: r => Math.round(r.total) },
        ]}
        rows={rows}
        sumRow={['Total', '', '', '', '', '', '', inr(Math.round(total))]}
        empty="Payroll computes from the roster and the Daily Ritual's per-rep sales logs."
      />
      <p className="small dim" style={{ margin: 0 }}>Clawback rule: incentive on any sale refunded within {cfg.comp.clawbackDays} days reverses automatically. It is the only mechanism that makes mis-selling structurally unprofitable for the seller — and mis-selling is what suspends RA registrations.</p>
    </div>
  )
}

function Refunds() {
  const { cfg, data, setData } = useStore()
  const today = todayISO()
  const [flash, setFlash] = useFlash()
  const [f, setF] = useState<{ productId: ProductId; amount: number; saleDate: string; repId: string; reason: string }>({ productId: 'p3', amount: cfg.products.find(p => p.id === 'p3')!.priceInclGst, saleDate: today, repId: '', reason: '' })
  const calc = useMemo(() => proRataRefund(cfg, f.productId, f.amount, f.saleDate, today), [cfg, f, today])
  const product = cfg.products.find(p => p.id === f.productId)

  const add = () => {
    const r: Refund = {
      id: uid('ref'), date: today, productId: f.productId, amount: product?.termMonths ? Math.round(calc.refund) : f.amount,
      saleDate: f.saleDate, repId: f.repId || undefined, reason: f.reason || 'client request', status: 'approved', proRataOfTerm: !!product?.termMonths,
    }
    setData(d => ({ ...d, refunds: [r, ...d.refunds] }))
    setFlash('Refund recorded — clawback (if within window) applies in Payroll automatically.')
  }

  return (
    <div className="stack">
      <div className="lbl">Pro-rata calculator — unexpired period, zero breakage, always</div>
      <div className="formrow">
        <Select label="Product" value={f.productId} onChange={v => {
          const p = cfg.products.find(x => x.id === v)!
          setF(s => ({ ...s, productId: v as ProductId, amount: p.priceInclGst }))
        }} options={cfg.products.map(p => [p.id, `${p.short}${p.termMonths ? ` (${p.termMonths}m term)` : ' (one-time)'}`])} />
        <Num label="Amount paid ₹" value={f.amount} onChange={v => setF(s => ({ ...s, amount: v }))} />
        <Text label="Sale date" value={f.saleDate} onChange={v => setF(s => ({ ...s, saleDate: v }))} />
        <Select label="Rep (for clawback)" value={f.repId} onChange={v => setF(s => ({ ...s, repId: v }))} options={[['', '—'], ...data.reps.filter(r => !r.planned).map(r => [r.id, r.name] as [string, string])]} />
        <Text label="Reason" value={f.reason} onChange={v => setF(s => ({ ...s, reason: v }))} />
      </div>
      {product?.termMonths ? (
        <div className="note">
          Terminating today: {calc.usedDays} of {calc.termDays} service days used → refund of the unexpired period = <strong className="mono">{inr(Math.round(calc.refund))}</strong>. Breakage fee: <strong>₹0</strong> (an RA may not charge one).
        </div>
      ) : (
        <div className="note">One-time product — refund per the published policy, not pro-rata. Amount as entered: <strong className="mono">{inr(f.amount)}</strong>.</div>
      )}
      <div className="row noprint"><button className="btn primary" onClick={add}><Plus size={14} /> Record refund</button>{flash && <Pill kind="good">{flash}</Pill>}</div>
      <DataTable
        csvName="refunds"
        cols={[
          { h: 'Date', render: (r: Refund) => fmtDate(r.date), csv: r => r.date },
          { h: 'Product', render: r => cfg.products.find(p => p.id === r.productId)?.short ?? r.productId, csv: r => r.productId },
          { h: 'Amount', num: true, render: r => inr(r.amount), csv: r => r.amount },
          { h: 'Sale date', render: r => fmtDate(r.saleDate), csv: r => r.saleDate },
          { h: 'Rep', render: r => data.reps.find(x => x.id === r.repId)?.name ?? '—', csv: r => data.reps.find(x => x.id === r.repId)?.name ?? '' },
          { h: 'Basis', render: r => r.proRataOfTerm ? 'pro-rata' : 'policy', csv: r => r.proRataOfTerm ? 'pro-rata' : 'policy' },
          { h: 'Reason', render: r => <span className="small">{r.reason}</span>, csv: r => r.reason },
        ]}
        rows={data.refunds}
        empty="Refunds recorded here reverse incentives inside the clawback window automatically."
      />
    </div>
  )
}
