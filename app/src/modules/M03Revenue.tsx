import React, { useMemo } from 'react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable } from '../components/ui'
import { SeriesBars } from '../components/charts'
import { inr, inrC, num, pct, todayISO, fmtDate } from '../lib/format'
import { planRevenueMonthly, sprintCal } from '../model/engine'

export default function M03() {
  const { cfg, data } = useStore()
  const cal = sprintCal(cfg, todayISO())
  const logs = useMemo(() => Object.values(data.daily).filter(l => l.date >= cal.start && l.date <= cal.end).sort((a, b) => a.date.localeCompare(b.date)), [data.daily, cal])
  const plan = planRevenueMonthly(cfg)

  const byProduct = useMemo(() => cfg.products.map(p => {
    const units = logs.reduce((s, l) => s + (l.units[p.id] || 0), 0)
    const coll = logs.reduce((s, l) => s + (l.collections[p.id] || 0), 0)
    const gwFee = coll * 0.022
    const incentive = p.desk === 'A'
      ? units * (p.id === 'p1' ? cfg.comp.deskAPerP1 : p.id === 'p2b' ? cfg.comp.deskAPerScannerAnnual : 0)
      : coll * cfg.comp.deskBPctP3P4
    const gst = coll - coll / (1 + cfg.target.gstRate)
    const contribution = coll - gst - gwFee - incentive
    return { p, units, coll, contribution, contributionPct: coll > 0 ? contribution / coll : 0 }
  }), [cfg, logs])

  const totals = byProduct.reduce((a, r) => ({ units: a.units + r.units, coll: a.coll + r.coll, contrib: a.contrib + r.contribution }), { units: 0, coll: 0, contrib: 0 })
  const deskA = byProduct.filter(r => r.p.desk === 'A').reduce((s, r) => s + r.coll, 0)
  const deskB = totals.coll - deskA

  const last14 = logs.slice(-14).map(l => ({
    d: fmtDate(l.date),
    A: cfg.products.filter(p => p.desk === 'A').reduce((s, p) => s + (l.collections[p.id] || 0), 0),
    B: cfg.products.filter(p => p.desk === 'B').reduce((s, p) => s + (l.collections[p.id] || 0), 0),
  }))

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ gap: 26 }}>
          <Stat label="Sprint collections to date" value={inrC(totals.coll)} hero sub={`${num(totals.units)} units sold`} />
          <Stat label="Desk A / Desk B" value={<span>{inrC(deskA)} <span className="dim">/</span> {inrC(deskB)}</span>}
            sub={totals.coll > 0 ? `${pct(deskA / totals.coll, 0)} acquisition · ${pct(deskB / totals.coll, 0)} warm base` : 'plan: roughly half each — the half that does not exist yet is Desk B'} />
          <Stat label="Contribution after GST, gateway, incentives" value={inrC(totals.contrib)} sub={totals.coll > 0 ? `${pct(totals.contrib / Math.max(1, totals.coll), 0)} of collections` : '—'} />
        </div>
      </Panel>

      <Panel span={7} title="Daily collections by desk — last 14 logged days">
        {last14.length ? (
          <SeriesBars xKey="d" stacked data={last14} series={[{ key: 'A', name: 'Desk A' }, { key: 'B', name: 'Desk B' }]} />
        ) : <div className="empty">No EOD logs yet. Collections appear here the day the Daily Ritual starts.</div>}
      </Panel>

      <Panel span={5} title="Plan mix at target run-rate">
        <DataTable
          cols={[
            { h: 'Product', render: (r: typeof cfg.products[number]) => r.short, csv: r => r.name },
            { h: 'Units/mo', num: true, render: r => num(r.unitsPlanMonthly), csv: r => r.unitsPlanMonthly },
            { h: 'Revenue/mo', num: true, render: r => inrC(r.priceInclGst * r.unitsPlanMonthly), csv: r => r.priceInclGst * r.unitsPlanMonthly },
            { h: 'Share', num: true, render: r => pct(r.priceInclGst * r.unitsPlanMonthly / plan.total, 0), csv: r => (r.priceInclGst * r.unitsPlanMonthly / plan.total).toFixed(3) },
          ]}
          rows={cfg.products}
          csvName="plan_mix"
          sumRow={['Plan total', '', inrC(plan.total), '100%']}
        />
      </Panel>

      <Panel span={12} title="Product P&L — sprint to date (per product contribution)">
        <DataTable
          csvName="product_pnl"
          cols={[
            { h: 'Product', render: (r: typeof byProduct[number]) => <span>{r.p.short} <span className="faint small">{r.p.regClass}</span></span>, csv: r => r.p.name },
            { h: 'Desk', render: r => r.p.desk, csv: r => r.p.desk },
            { h: 'Units', num: true, render: r => num(r.units), csv: r => r.units },
            { h: 'Collections', num: true, render: r => inr(Math.round(r.coll)), csv: r => Math.round(r.coll) },
            { h: 'Plan/mo', num: true, render: r => inrC(r.p.priceInclGst * r.p.unitsPlanMonthly), csv: r => r.p.priceInclGst * r.p.unitsPlanMonthly },
            { h: 'Contribution', num: true, render: r => inr(Math.round(r.contribution)), csv: r => Math.round(r.contribution) },
            { h: 'Margin', num: true, render: r => pct(r.contributionPct, 0), csv: r => r.contributionPct.toFixed(3) },
          ]}
          rows={byProduct}
          sumRow={['Total', '', num(totals.units), inr(Math.round(totals.coll)), inrC(plan.total), inr(Math.round(totals.contrib)), totals.coll > 0 ? pct(totals.contrib / totals.coll, 0) : '—']}
          empty="Log sales in the Daily Ritual to build the P&L."
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>Contribution = collections − GST ({pct(cfg.target.gstRate, 0)} extracted) − gateway (2.2%) − direct sales incentive. Ad spend is deliberately not allocated per product here; channel CAC lives in the Lead Engine.</p>
      </Panel>
    </div>
  )
}
