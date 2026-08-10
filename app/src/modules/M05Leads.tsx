import React, { useMemo } from 'react'
import { useStore } from '../state/store'
import { Panel, Stat, DataTable, Pill, Select, Num, Text } from '../components/ui'
import { SeriesBars } from '../components/charts'
import { inr, inrC, num, pct, todayISO, fmtDate } from '../lib/format'
import { channelRisk, solveFunnel, sprintCal, sprintWeekOf } from '../model/engine'
import type { ChannelHealth } from '../model/types'

export default function M05() {
  const { cfg, data, setData } = useStore()
  const cal = sprintCal(cfg, todayISO())
  const logs = useMemo(() => Object.values(data.daily).filter(l => l.date >= cal.start && l.date <= cal.end).sort((a, b) => a.date.localeCompare(b.date)), [data.daily, cal])

  const byChannel = useMemo(() => cfg.channels.map(ch => {
    const leads = logs.reduce((s, l) => s + (l.leadsBySource[ch.id] || 0), 0)
    const spend = logs.reduce((s, l) => s + (l.spend[ch.id] || 0), 0)
    return { ch, leads, spend, cpl: leads > 0 ? spend / leads : null }
  }), [cfg.channels, logs])

  const totalLeads = byChannel.reduce((s, r) => s + r.leads, 0)
  const totalSpend = byChannel.reduce((s, r) => s + r.spend, 0)
  const week = Math.min(sprintWeekOf(cfg, cal.today), cfg.target.runRatePlanWeekly.length)
  const solved = solveFunnel(cfg, cfg.target.runRatePlanWeekly[week - 1])

  const stlDays = logs.filter(l => l.speedToLeadMedianMin != null)
  const stlLast = stlDays.at(-1)?.speedToLeadMedianMin ?? null
  const stlOk = stlLast != null && stlLast <= cfg.funnel.speedToLeadTargetMin

  const last14 = logs.slice(-14).map(l => {
    const row: Record<string, unknown> = { d: fmtDate(l.date) }
    for (const ch of cfg.channels) row[ch.id] = l.leadsBySource[ch.id] || 0
    return row
  })

  const concentration = totalLeads > 0 ? Math.max(...byChannel.map(r => r.leads / totalLeads)) : 0

  const setHealth = (channelId: string, patch: Partial<ChannelHealth>) => {
    setData(d => {
      const has = d.channelHealth.some(h => h.channelId === channelId)
      const list = has
        ? d.channelHealth.map(h => h.channelId === channelId ? { ...h, ...patch, lastChecked: todayISO() } : h)
        : [...d.channelHealth, { channelId, accountStatus: 'healthy' as const, verificationDone: false, siPortalMatched: false, disapprovalPct: 0, appealOpen: false, lastChecked: todayISO(), ...patch }]
      return { ...d, channelHealth: list }
    })
  }

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ gap: 26 }}>
          <Stat label="Leads — sprint to date" value={num(totalLeads)} sub={`need ≈ ${num(solved.leadsDaily, 0)}/day this week`} />
          <Stat label="Blended CPL (paid)" value={totalSpend > 0 && totalLeads > 0 ? inr(Math.round(totalSpend / Math.max(1, byChannel.filter(r => r.ch.paid).reduce((s, r) => s + r.leads, 0)))) : '—'} sub={`plan ₹${cfg.funnel.cplBlended}`} />
          <Stat label="Speed-to-lead (last logged)" value={stlLast == null ? '—' : `${stlLast} min`} tone={stlLast == null ? undefined : stlOk ? 'good' : 'bad'}
            sub={`target ≤ ${cfg.funnel.speedToLeadTargetMin} min — the single fastest free lever (connect 55% → 70%)`} />
          <Stat label="Channel concentration" value={totalLeads > 0 ? pct(concentration, 0) : '—'} tone={concentration > 0.45 ? 'bad' : undefined} sub="no single channel above 45%" />
        </div>
      </Panel>

      <Panel span={7} title="Leads by source — last 14 logged days">
        {last14.length ? (
          <SeriesBars xKey="d" stacked moneyFmt={false} data={last14}
            series={cfg.channels.map(c => ({ key: c.id, name: c.name.split(' (')[0] }))} />
        ) : <div className="empty">Leads appear once the Daily Ritual logs them by source.</div>}
      </Panel>

      <Panel span={5} title="Channel economics — sprint to date">
        <DataTable
          csvName="channel_econ"
          cols={[
            { h: 'Channel', render: (r: typeof byChannel[number]) => r.ch.name.split(' (')[0], csv: r => r.ch.name },
            { h: 'Spend', num: true, render: r => inrC(r.spend), csv: r => Math.round(r.spend) },
            { h: 'Leads', num: true, render: r => num(r.leads), csv: r => r.leads },
            { h: 'CPL', num: true, render: r => (r.cpl != null ? inr(Math.round(r.cpl)) : '—'), csv: r => r.cpl?.toFixed(0) ?? '' },
            { h: 'vs target', num: true, render: r => r.cpl != null && r.ch.cplTarget > 0 ? <span className={r.cpl <= r.ch.cplTarget ? 'delta-good' : 'delta-bad'}>{pct(r.cpl / r.ch.cplTarget - 1, 0)}</span> : '—' },
          ]}
          rows={byChannel}
          empty="No spend/leads logged yet."
        />
      </Panel>

      <Panel span={12} title="Channel health monitor — the account-block problem, managed">
        <div className="note warn small" style={{ marginBottom: 10 }}>
          The fix for blocked accounts is verification, not evasion: SI-Portal contact details matching Meta and Google exactly, Meta SEBI advertiser verification (education brand may use the alternate route — separate ad accounts exist for this reason), Google India financial-services verification. New accounts and borrowed BMs now fail structurally and create a regulatory record.
        </div>
        <DataTable
          csvName="channel_health"
          cols={[
            { h: 'Channel', render: (r: { ch: typeof cfg.channels[number]; h: ChannelHealth | undefined }) => r.ch.name.split(' (')[0], csv: r => r.ch.name },
            {
              h: 'Account status', render: r => (
                <Select value={r.h?.accountStatus ?? 'healthy'} onChange={v => setHealth(r.ch.id, { accountStatus: v as ChannelHealth['accountStatus'] })}
                  options={[['healthy', 'Healthy'], ['limited', 'Limited'], ['in_review', 'In review'], ['banned', 'Banned']]} />
              ), csv: r => r.h?.accountStatus ?? 'healthy',
            },
            { h: 'Platform verification', render: r => <label className="check"><input type="checkbox" checked={r.h?.verificationDone ?? false} onChange={e => setHealth(r.ch.id, { verificationDone: e.target.checked })} /> done</label>, csv: r => r.h?.verificationDone ? 'yes' : 'no' },
            { h: 'SI-portal match', render: r => <label className="check"><input type="checkbox" checked={r.h?.siPortalMatched ?? false} onChange={e => setHealth(r.ch.id, { siPortalMatched: e.target.checked })} /> matched</label>, csv: r => r.h?.siPortalMatched ? 'yes' : 'no' },
            { h: 'Disapproval %', num: true, render: r => <span style={{ display: 'inline-block', width: 74 }}><Num value={r.h?.disapprovalPct ?? 0} onChange={v => setHealth(r.ch.id, { disapprovalPct: v })} /></span>, csv: r => r.h?.disapprovalPct ?? 0 },
            { h: 'Appeal open', render: r => <label className="check"><input type="checkbox" checked={r.h?.appealOpen ?? false} onChange={e => setHealth(r.ch.id, { appealOpen: e.target.checked })} /></label>, csv: r => r.h?.appealOpen ? 'yes' : 'no' },
            {
              h: 'Risk', render: r => {
                const risk = channelRisk(r.h ?? { accountStatus: 'healthy', verificationDone: false, siPortalMatched: false, disapprovalPct: 0, appealOpen: false })
                const kind = risk.band === 'low' ? 'good' : risk.band === 'elevated' ? 'warn' : risk.band === 'high' ? 'serious' : 'crit'
                return <Pill kind={kind}>{risk.score}/100 · {risk.band}</Pill>
              }, csv: r => channelRisk(r.h ?? { accountStatus: 'healthy', verificationDone: false, siPortalMatched: false, disapprovalPct: 0, appealOpen: false }).score,
            },
            { h: 'Note', render: r => <span style={{ display: 'inline-block', minWidth: 160 }}><Text value={r.h?.note ?? ''} onChange={v => setHealth(r.ch.id, { note: v })} placeholder="…" /></span>, csv: r => r.h?.note ?? '' },
          ]}
          rows={cfg.channels.filter(c => c.paid).map(ch => ({ ch, h: data.channelHealth.find(h => h.channelId === ch.id) }))}
        />
      </Panel>

      <Panel span={12} title="Lead efficiency levers — worth more than more spend">
        <div className="twrap"><table className="t">
          <thead><tr><th>Lever</th><th>Expected impact</th><th>Owner</th></tr></thead>
          <tbody>
            <tr><td><strong>Speed-to-lead under 5 minutes</strong></td><td>Connect 55% → 70% — the single biggest lever, costs nothing</td><td>Sales Head</td></tr>
            <tr><td>Pre-qualification on the form (capital band, city, language)</td><td>Qualification 45% → 58%</td><td>Marketing</td></tr>
            <tr><td>WhatsApp opt-in instead of bare form fill</td><td>Intent and connect rate up materially</td><td>Marketing</td></tr>
            <tr><td>Structured 7-touch cadence over 14 days</td><td>Touches 3–7 add 25–35% more sales from the same leads</td><td>TLs</td></tr>
            <tr><td>Lead scoring routes A-grades to top closers</td><td>Top-decile close rate up 30–40%</td><td>Sales Head</td></tr>
            <tr><td>Day-21 recycle of unconnected leads</td><td>Recovers 8–12% of dead leads at zero CPL</td><td>TLs</td></tr>
          </tbody>
        </table></div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>Compounded, these lift net lead→sale from {pct(cfg.funnel.connectRate * cfg.funnel.qualRate * cfg.funnel.closeRate, 2)} toward 4.5%+ — roughly ₹1.8L/month of avoided ad spend. Model it in the Quant Engine solver.</p>
      </Panel>
    </div>
  )
}
