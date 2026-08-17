import React, { useMemo, useState } from 'react'
import { Copy, RefreshCw, Printer, TrendingUp, PhoneOff } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Stat, Pill, DataTable, useFlash } from '../components/ui'
import { inr, inrC, num, pct, todayISO, addDays, isSunday, fmtDateFull, diffDays } from '../lib/format'
import { collectionsOf, dayVariance, pacing, sprintCal, sprintWeekOf, solveFunnel, rampPct } from '../model/engine'
import { adActions, objectiveWarnings, feedTotals, FIRST_PULL } from '../model/feed'

/** The 08:45 artifact. One page the 09:00 huddle runs on, copyable to WhatsApp. */
export default function M15() {
  const { cfg, data } = useStore()
  const [flash, setFlash] = useFlash()
  const today = todayISO()
  const cal = sprintCal(cfg, today)
  const yday = useMemo(() => {
    let d = addDays(today, -1)
    while (isSunday(d)) d = addDays(d, -1)
    return d
  }, [today])

  const pace = useMemo(() => pacing(cfg, data, today), [cfg, data, today])
  const feed = data.feed ?? FIRST_PULL
  const totals = useMemo(() => feedTotals(feed), [feed])
  const targetCpl = cfg.funnel.cplBlended
  const actions = useMemo(() => [...adActions(feed.ads, targetCpl), ...objectiveWarnings(feed.campaigns)], [feed, targetCpl])

  const ylog = data.daily[yday]
  const yColl = collectionsOf(ylog)
  const week = Math.min(sprintWeekOf(cfg, cal.today), cfg.target.runRatePlanWeekly.length)
  const required = cfg.target.runRatePlanWeekly[week - 1] / cfg.target.workingDaysPerMonth
  const solved = solveFunnel(cfg, cfg.target.runRatePlanWeekly[week - 1])

  // The backlog that killed July: leads generated but never dispositioned.
  const backlog = useMemo(() => {
    let inTotal = 0, worked = 0
    for (const l of Object.values(data.daily)) { inTotal += l.leadsIn; worked += l.leadsWorked ?? 0 }
    const feedLeads = totals.leads
    return { logged: inTotal, worked, feedLeads, unworked: Math.max(0, Math.max(inTotal, feedLeads) - worked) }
  }, [data.daily, totals.leads])

  // Per-rep coaching: the one line each closer's TL should say today.
  const coaching = useMemo(() => {
    const floor = data.reps.filter(r => r.active && (!r.planned || r.joinDate <= today))
    return floor.map(rep => {
      let dials = 0, connects = 0, quals = 0, sales = 0, revenue = 0, days = 0
      for (const l of Object.values(data.daily)) {
        const rd = l.reps[rep.id]; if (!rd) continue
        dials += rd.dials; connects += rd.connects; quals += rd.quals; sales += rd.sales; revenue += rd.revenue; days++
      }
      const weeks = Math.max(1, Math.floor(diffDays(rep.joinDate, today) / 7) + 1)
      const expected = rampPct(cfg, weeks)
      const connectRate = dials > 0 ? connects / dials : null
      const closeRate = quals > 0 ? sales / quals : null
      const dialsPerDay = days > 0 ? dials / days : 0
      let point: string
      if (days === 0) point = 'No activity logged yet — the first coaching point is that the numbers must exist.'
      else if (dialsPerDay < cfg.desks.A.dialsPerDayRamped * (expected / 100) * 0.8) point = `Dial volume is the gap — ${num(dialsPerDay, 0)}/day against ${Math.round(cfg.desks.A.dialsPerDayRamped * expected / 100)} expected at ${expected}% ramp. Activity before technique.`
      else if (connectRate != null && connectRate < cfg.funnel.connectRate * 0.85) point = `Connects are the gap — ${pct(connectRate, 0)} against ${pct(cfg.funnel.connectRate, 0)}. Rotate calling windows and check the number pool before touching the pitch.`
      else if (closeRate != null && closeRate < cfg.funnel.closeRate * 0.85) point = `Closing is the gap — ${pct(closeRate, 0)} of qualified conversations against ${pct(cfg.funnel.closeRate, 0)}. Sit with them on the price-and-silence drill.`
      else point = 'On or above line — ask them what they are doing differently and put it in the script bank.'
      return { rep, dialsPerDay, connectRate, closeRate, revenue, expected, point }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [data, cfg, today])

  const variance = useMemo(() => dayVariance(cfg, data, yday), [cfg, data, yday])
  const misses = variance.filter(v => !v.ok)

  const fixes = useMemo(() => {
    const out: string[] = []
    if (backlog.unworked > 0) out.push(`Work the ${num(backlog.unworked)} untouched leads before buying a single new one. A cheap lead nobody calls costs more than an expensive one that converts.`)
    const scale = actions.find(a => a.kind === 'scale')
    if (scale) out.push(`${scale.ad.name}: ${scale.headline}. Raise budget 20–30%, no more.`)
    const kill = actions.find(a => a.kind === 'pause')
    if (kill) out.push(`${kill.ad.name}: ${kill.headline}.`)
    for (const m of misses.slice(0, 2)) out.push(`${m.metric} missed yesterday — plan ${m.plan}, actual ${m.actual}.`)
    if (!ylog) out.push(`No EOD log for ${yday}. A missing number is treated exactly like a bad number.`)
    return out.slice(0, 3)
  }, [backlog, actions, misses, ylog, yday])

  const plain = useMemo(() => {
    const L: string[] = []
    L.push(`*5 CIRCLES — MORNING BRIEF*`)
    L.push(`${fmtDateFull(today)} · ${cal.dayIndex > 0 ? `Day ${cal.dayIndex}/${cal.days}` : `T−${Math.max(0, diffDays(today, cfg.prep.endDate))} to Day 1`}`)
    L.push('')
    L.push(`*THE NUMBER*`)
    L.push(`Yesterday collected: ${inr(Math.round(yColl))} (needed ${inr(Math.round(required))})`)
    L.push(`Cumulative vs line: ${inrC(pace.variance, { sign: true })}`)
    L.push(`Per remaining working day: ${inr(Math.round(pace.requiredPerRemainingWD))}`)
    L.push('')
    L.push(`*LEADS*`)
    L.push(`Customer leads: ${num(totals.leads)} at ${totals.cpl ? `₹${totals.cpl.toFixed(2)}` : '—'} CPL (target ₹${targetCpl})`)
    if (totals.recruitLeads) L.push(`Hiring applicants: ${num(totals.recruitLeads)} at ${totals.recruitCpa ? `₹${totals.recruitCpa.toFixed(2)}` : '—'} — separate from customer CPL`)
    if (backlog.unworked > 0) L.push(`⚠ UNWORKED LEADS: ${num(backlog.unworked)} — call these before spending more`)
    L.push(`Need ${num(solved.leadsDaily, 0)} leads/day and ${num(solved.dialsDaily, 0)} dials/day this week`)
    L.push('')
    L.push(`*TODAY'S THREE*`)
    fixes.forEach((f, i) => L.push(`${i + 1}. ${f}`))
    L.push('')
    L.push(`*FLOOR*`)
    coaching.slice(0, 8).forEach(c => L.push(`${c.rep.name} (${c.rep.desk}) — ${inr(Math.round(c.revenue))} · ${c.point}`))
    return L.join('\n')
  }, [today, cal, cfg, yColl, required, pace, totals, targetCpl, backlog, solved, fixes, coaching])

  const copy = async () => {
    try { await navigator.clipboard.writeText(plain); setFlash('Brief copied — paste into the founders/sales group.') }
    catch { setFlash('Clipboard blocked — select the text below and copy manually.') }
  }

  return (
    <div className="grid">
      <Panel span={12}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 26 }}>
            <Stat label="Morning brief" value={fmtDateFull(today)} sub={`issued 08:45 · huddle 09:00 · dialling 09:30`} />
            <Stat label="Yesterday" value={inr(Math.round(yColl))} tone={yColl >= required ? 'good' : 'bad'} sub={`needed ${inr(Math.round(required))} · ${yday}`} />
            <Stat label="Per remaining working day" value={inr(Math.round(pace.requiredPerRemainingWD))} sub={pace.variance >= 0 ? `${inrC(pace.variance)} ahead` : `${inrC(-pace.variance)} behind`} />
            <Stat label="Customer CPL (live)" value={totals.cpl ? `₹${totals.cpl.toFixed(2)}` : '—'} tone={totals.cpl && totals.cpl <= targetCpl ? 'good' : undefined}
              sub={`${num(totals.leads)} customer leads from ${inr(Math.round(totals.spend))} · plan assumes ₹${targetCpl}`} />
          </div>
          <div className="row noprint">
            <button className="btn primary" onClick={copy}><Copy size={14} /> Copy for WhatsApp</button>
            <button className="btn" onClick={() => window.print()}><Printer size={14} /> Print</button>
          </div>
        </div>
        {flash && <div className="note good" style={{ marginTop: 8 }}>{flash}</div>}
      </Panel>

      {backlog.unworked > 0 && (
        <Panel span={12}>
          <div className="note crit" style={{ margin: 0 }}>
            <PhoneOff size={15} style={{ verticalAlign: -3 }} /> <strong>{num(backlog.unworked)} leads generated and not yet worked.</strong> This is the July failure repeating — 260+ leads were generated then and every one stayed at status CREATED. Work these before buying a single new lead: at your live CPL they cost {inr(Math.round(backlog.unworked * (totals.cpl ?? targetCpl)))} to acquire and are worth nothing uncalled.
          </div>
        </Panel>
      )}

      <Panel span={5} title="Today's three">
        <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fixes.map((f, i) => <li key={i} style={{ fontSize: 14.5, lineHeight: 1.45 }}>{f}</li>)}
          {fixes.length === 0 && <li className="dim">Everything on plan. Raise today's stretch 10% and bank the surplus.</li>}
        </ol>
        <hr className="hr" />
        <div className="kv">
          <dt>Leads needed today</dt><dd>{num(solved.leadsDaily, 0)}</dd>
          <dt>Dials needed today</dt><dd>{num(solved.dialsDaily, 0)}</dd>
          <dt>Speed-to-lead target</dt><dd>≤ {cfg.funnel.speedToLeadTargetMin} min</dd>
        </div>
      </Panel>

      <Panel span={7} title="Ad actions — what to do about each ad today">
        <div className="stack" style={{ gap: 7 }}>
          {actions.map((a, i) => (
            <div key={i} className="note" style={{ borderColor: `var(--s-${a.severity === 'good' ? 'good' : a.severity === 'crit' ? 'crit' : a.severity === 'warn' ? 'warn' : 'good'})`, background: 'var(--panel2)' }}>
              <div className="row" style={{ gap: 8, marginBottom: 3 }}>
                <Pill kind={a.severity}>{a.kind.replace(/_/g, ' ')}</Pill>
                <strong>{a.ad.name}</strong>
                <span className="small dim">₹{Math.round(a.ad.spend)} · {a.ad.results || 0} leads</span>
              </div>
              <div style={{ fontSize: 13.5 }}><strong>{a.headline}.</strong> {a.why}</div>
            </div>
          ))}
          {actions.length === 0 && <div className="empty">No live ad data. Import a feed in Config → Live data.</div>}
        </div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>From the snapshot pulled {feed.pulledAt.slice(0, 16).replace('T', ' ')} ({feed.source}). Target CPL ₹{targetCpl} is editable in Config.</p>
      </Panel>

      <Panel span={12} title="Floor — per-rep coaching for today's 1:1s">
        <DataTable
          csvName="coaching_pack"
          cols={[
            { h: '#', render: (_r, i) => <span className="mono faint">{i + 1}</span> },
            { h: 'Rep', render: (c: typeof coaching[number]) => <span><strong>{c.rep.name}</strong> <span className="faint small">({c.rep.desk})</span></span>, csv: c => c.rep.name },
            { h: 'Ramp', num: true, render: c => `${c.expected}%`, csv: c => c.expected },
            { h: 'Dials/day', num: true, render: c => num(c.dialsPerDay, 0), csv: c => Math.round(c.dialsPerDay) },
            { h: 'Connect', num: true, render: c => (c.connectRate != null ? pct(c.connectRate, 0) : '—'), csv: c => c.connectRate?.toFixed(3) ?? '' },
            { h: 'Close', num: true, render: c => (c.closeRate != null ? pct(c.closeRate, 0) : '—'), csv: c => c.closeRate?.toFixed(3) ?? '' },
            { h: 'Revenue', num: true, render: c => inr(Math.round(c.revenue)), csv: c => Math.round(c.revenue) },
            { h: 'The one coaching point', render: c => <span className="small">{c.point}</span>, csv: c => c.point },
          ]}
          rows={coaching}
          empty="Add reps in Sales Command; their numbers arrive from the dialler feed or the EOD form."
        />
      </Panel>

      <Panel span={12} title="Plain text — exactly what gets pasted into the group">
        <pre className="mono" style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, background: 'var(--panel2)', padding: 12, borderRadius: 3, margin: 0, overflowX: 'auto' }}>{plain}</pre>
      </Panel>
    </div>
  )
}
