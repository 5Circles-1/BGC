import React, { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Num, Text, Select, DataTable, useFlash, Pill, Stat } from '../components/ui'
import { inr, inrC, uid } from '../lib/format'
import { exportAll, importAll, wipeAll, downloadFile } from '../lib/storage'
import { planRevenueMonthly } from '../model/engine'
import { FIRST_PULL, applyFeed, feedTotals, type FeedSnapshot } from '../model/feed'

export default function Config() {
  const { cfg, setCfg, resetConfig, mode, theme, setTheme } = useStore()
  const [flash, setFlash] = useFlash()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const plan = planRevenueMonthly(cfg)

  const setProduct = (id: string, patch: Partial<(typeof cfg.products)[number]>) =>
    setCfg(c => ({ ...c, products: c.products.map(p => (p.id === id ? { ...p, ...patch } : p)) }))
  const addProduct = () =>
    setCfg(c => ({
      ...c,
      products: [...c.products, {
        id: uid('prod'), name: 'New product', short: 'New product', priceInclGst: 0, unitsPlanMonthly: 0,
        desk: 'A' as const, regClass: 'education' as const, countsTowardCap: false, termMonths: 0, shipsDay1: true,
      }],
    }))
  const removeProduct = (id: string) => {
    if (cfg.products.length <= 1) { setFlash('Keep at least one product — the funnel is solved against it.'); return }
    setCfg(c => {
      const products = c.products.filter(p => p.id !== id)
      return {
        ...c, products,
        anchorProductId: c.anchorProductId === id ? (products.find(p => p.desk === 'A') ?? products[0]).id : c.anchorProductId,
        bumpProductId: c.bumpProductId === id ? '' : c.bumpProductId,
      }
    })
    setFlash('Product removed. Any daily logs already recorded against it are kept.')
  }

  const doExport = async () => {
    const r = await downloadFile(`operator-backup-${new Date().toISOString().slice(0, 10)}.json`, exportAll())
    setFlash(r === 'declined' ? 'Save declined.' : 'Backup exported.')
  }
  const doImport = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = importAll(String(reader.result))
      if (res.ok) { setFlash(`Restored ${res.keys} keys — reloading.`); setTimeout(() => window.location.reload(), 800) }
      else setFlash(`Import failed: ${res.error}`)
    }
    reader.readAsText(f)
  }

  return (
    <div className="grid">
      <Panel span={12} title="Data & appearance">
        <div className="row">
          <button className="btn" onClick={doExport}><Download size={14} /> Export full JSON backup</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={14} /> Restore backup</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) doImport(f) }} />
          <button className="btn" onClick={() => { resetConfig(); setFlash('Model restored to CEO defaults (operating data untouched).') }}><RotateCcw size={14} /> Restore CEO defaults</button>
          <button className="btn danger" onClick={() => setConfirmWipe(true)}><Trash2 size={14} /> Reset everything…</button>
          <Select label="Theme" value={theme} onChange={v => setTheme(v as 'dark' | 'light')} options={[['dark', 'Dark (desk)'], ['light', 'Light (paper)']]} />
          <Pill kind={mode === 'local' ? 'good' : 'warn'}>{mode === 'local' ? 'saving to this browser' : 'memory only — export backups!'}</Pill>
          {flash && <span className="small dim">{flash}</span>}
        </div>
        {confirmWipe && (
          <div className="note crit" style={{ marginTop: 10 }}>
            This deletes every log, roster, ledger and setting stored in this browser. Export a backup first.
            <span className="row" style={{ marginTop: 6 }}>
              <button className="btn danger" onClick={() => { wipeAll(); window.location.reload() }}>Yes, wipe and restart</button>
              <button className="btn" onClick={() => setConfirmWipe(false)}>Cancel</button>
            </span>
          </div>
        )}
        <p className="small dim" style={{ margin: '8px 0 0' }}>
          Data lives in this browser only (no server, no PII). Team-shared state = one operator machine or a daily JSON backup passed to the war room. Everything numeric on this page recalculates the whole system live.
        </p>
      </Panel>

      <LiveData />

      <Panel span={6} title="Entity (Discovery Q1–Q3 — confirm with CS & Compliance Officer)">
        <div className="stack">
          <Text label="Legal name" value={cfg.entity.legalName} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, legalName: v } }))} />
          <div className="formrow">
            <Text label="Brand" value={cfg.entity.brand} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, brand: v } }))} />
            <Text label="SEBI RA reg. no." value={cfg.entity.sebiReg} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, sebiReg: v } }))} />
            <Text label="CIN" value={cfg.entity.cin} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, cin: v } }))} placeholder="confirm" />
          </div>
          <div className="formrow">
            <Text label="Registered office" value={cfg.entity.registeredOffice} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, registeredOffice: v } }))} />
            <Text label="Corporate office" value={cfg.entity.corporateOffice} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, corporateOffice: v } }))} />
          </div>
          <div className="formrow">
            <Text label="Compliance Officer" value={cfg.entity.complianceOfficer} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, complianceOfficer: v } }))} placeholder="appoint / confirm — mandatory" />
            <Text label="Principal Officer" value={cfg.entity.principalOfficer} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, principalOfficer: v } }))} />
            <Select label="Registration type" value={cfg.entity.regType} onChange={v => setCfg(c => ({ ...c, entity: { ...c.entity, regType: v as typeof c.entity.regType } }))}
              options={[['unconfirmed', 'Unconfirmed'], ['non-individual', 'Non-individual'], ['individual', 'Individual']]} />
          </div>
        </div>
      </Panel>

      <Panel span={6} title="Sprint & target">
        <div className="formrow">
          <Text label="Day 1" value={cfg.sprint.startDate} onChange={v => setCfg(c => ({ ...c, sprint: { ...c.sprint, startDate: v } }))} />
          <Num label="Days" value={cfg.sprint.days} onChange={v => setCfg(c => ({ ...c, sprint: { ...c.sprint, days: Math.max(7, Math.round(v)) } }))} />
          <Num label="Target monthly ₹" value={cfg.target.monthlyRunRate} step={100000} onChange={v => setCfg(c => ({ ...c, target: { ...c.target, monthlyRunRate: v } }))} />
          <Select label="Basis (Q10)" value={cfg.target.basis} onChange={v => setCfg(c => ({ ...c, target: { ...c.target, basis: v as 'gross' | 'net' } }))}
            options={[['gross', 'Gross incl. GST'], ['net', 'Net of GST (+18% gross needed)']]} />
          <Num label="GST rate" value={cfg.target.gstRate} step={0.01} onChange={v => setCfg(c => ({ ...c, target: { ...c.target, gstRate: v } }))} />
          <Num label="Working days/mo" value={cfg.target.workingDaysPerMonth} onChange={v => setCfg(c => ({ ...c, target: { ...c.target, workingDaysPerMonth: v } }))} />
        </div>
        <div className="lbl" style={{ margin: '10px 0 4px' }}>Weekly run-rate plan (the pacing spine, ₹/month at each sprint week)</div>
        <div className="row" style={{ gap: 6 }}>
          {cfg.target.runRatePlanWeekly.map((v, i) => (
            <label key={i} className="field" style={{ flex: '0 0 96px' }}>
              <span className="lbl">W{i + 1}</span>
              <input className="in mono" type="number" step={50000} value={v}
                onChange={e => setCfg(c => ({ ...c, target: { ...c.target, runRatePlanWeekly: c.target.runRatePlanWeekly.map((x, j) => j === i ? (parseFloat(e.target.value) || 0) : x) } }))} />
            </label>
          ))}
        </div>
        <p className="small dim" style={{ margin: '6px 0 0' }}>W1 = today's honest base. Last week = the target. The burn-up line integrates this plan over working days.</p>
      </Panel>

      <Panel span={12} title={`Your products — ${cfg.products.length} on the ladder, ${inrC(plan.total)}/mo at plan (Desk A ${inrC(plan.deskA)} · Desk B ${inrC(plan.deskB)})`}
        right={<button className="btn primary sm noprint" onClick={addProduct}>+ Add a product</button>}>
        <p className="small dim" style={{ margin: '0 0 8px' }}>
          Type your own names — Traders Discovery Programme, Grow, Grow+, CTC, whatever the floor actually says on the phone. Every screen in the tool uses these names.
        </p>
        <div className="twrap">
          <table className="t">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Product name</th>
                <th>Type</th><th>Desk</th>
                <th className="num">Price ₹</th><th className="num">Units/mo</th><th className="num">Revenue/mo</th>
                <th>Day 1?</th><th>Fee cap</th><th></th>
              </tr>
            </thead>
            <tbody>
              {cfg.products.map(p => (
                <tr key={p.id}>
                  <td>
                    <Text value={p.short} onChange={v => setProduct(p.id, { short: v, name: v })} placeholder="e.g. Traders Discovery Programme" />
                    {cfg.anchorProductId === p.id && <span className="small" style={{ color: 'var(--accent)' }}>★ the product the funnel is solved against</span>}
                  </td>
                  <td><Select value={p.regClass} onChange={v => setProduct(p.id, { regClass: v as typeof p.regClass, countsTowardCap: v === 'research' })}
                    options={[['education', 'Education'], ['saas', 'Tool / SaaS'], ['research', 'Research (RA)']]} /></td>
                  <td><Select value={p.desk} onChange={v => setProduct(p.id, { desk: v as 'A' | 'B' })} options={[['A', 'A — new'], ['B', 'B — existing']]} /></td>
                  <td className="num"><span style={{ display: 'inline-block', width: 96 }}><Num value={p.priceInclGst} step={100} onChange={v => setProduct(p.id, { priceInclGst: v })} /></span></td>
                  <td className="num"><span style={{ display: 'inline-block', width: 80 }}><Num value={p.unitsPlanMonthly} onChange={v => setProduct(p.id, { unitsPlanMonthly: v })} /></span></td>
                  <td className="num"><strong>{inrC(p.priceInclGst * p.unitsPlanMonthly)}</strong></td>
                  <td><label className="check"><input type="checkbox" checked={p.shipsDay1} onChange={e => setProduct(p.id, { shipsDay1: e.target.checked })} /> {p.shipsDay1 ? 'ships' : <span style={{ color: 'var(--s-serious)' }}>deferred</span>}</label></td>
                  <td>{p.countsTowardCap ? <Pill kind="warn">counts</Pill> : <span className="faint small">outside</span>}</td>
                  <td className="noprint">
                    <span className="row" style={{ gap: 4 }}>
                      {cfg.anchorProductId !== p.id && p.desk === 'A' && <button className="btn sm" title="Make this the product the funnel is solved against" onClick={() => setCfg(c => ({ ...c, anchorProductId: p.id }))}>★</button>}
                      <button className="btn sm danger" onClick={() => removeProduct(p.id)}>Delete</button>
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="sum">
                <td>Total</td><td /><td /><td /><td className="num">{cfg.products.reduce((s, p) => s + p.unitsPlanMonthly, 0)}</td>
                <td className="num">{inrC(plan.total)}</td>
                <td className="num">{cfg.products.filter(p => p.shipsDay1).length} of {cfg.products.length}</td><td /><td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small dim" style={{ margin: '8px 0 0' }}>
          <strong>Type</strong> decides the compliance treatment, not the name: anything marked <em>Research (RA)</em> counts against the ₹1,51,000 family cap and needs KYC, an agreement, a risk profile and analyst sign-off before access. <strong>Day 1?</strong> unticked means the product is deferred — it stays off the price list and its revenue is shown as not shipping. <strong>★</strong> marks the anchor: the one product the lead funnel is solved against.
        </p>
      </Panel>

      <Panel span={6} title="Desks, ramp & comp">
        <div className="formrow">
          <Num label="A dials/day (ramped)" value={cfg.desks.A.dialsPerDayRamped} onChange={v => setCfg(c => ({ ...c, desks: { ...c.desks, A: { ...c.desks.A, dialsPerDayRamped: v } } }))} />
          <Num label="A P1 sales/day (ramped)" value={cfg.desks.A.p1PerDayRamped} step={0.1} onChange={v => setCfg(c => ({ ...c, desks: { ...c.desks, A: { ...c.desks.A, p1PerDayRamped: v } } }))} />
          <Num label="B revenue/mo ₹" value={cfg.desks.B.revenuePerMonth} step={10000} onChange={v => setCfg(c => ({ ...c, desks: { ...c.desks, B: { ...c.desks.B, revenuePerMonth: v } } }))} />
        </div>
        <div className="lbl" style={{ margin: '10px 0 4px' }}>Ramp curve — % of full output by week since join</div>
        <div className="row" style={{ gap: 6 }}>
          {cfg.ramp.curveByWeek.map((v, i) => (
            <label key={i} className="field" style={{ flex: '0 0 64px' }}>
              <span className="lbl">W{i + 1}</span>
              <input className="in mono" type="number" value={v}
                onChange={e => setCfg(c => ({ ...c, ramp: { curveByWeek: c.ramp.curveByWeek.map((x, j) => j === i ? (parseFloat(e.target.value) || 0) : x) } }))} />
            </label>
          ))}
        </div>
        <div className="formrow" style={{ marginTop: 10 }}>
          <Num label="A fixed ₹" value={cfg.comp.deskAFixed} step={500} onChange={v => setCfg(c => ({ ...c, comp: { ...c.comp, deskAFixed: v } }))} />
          <Num label="₹/P1" value={cfg.comp.deskAPerP1} step={50} onChange={v => setCfg(c => ({ ...c, comp: { ...c.comp, deskAPerP1: v } }))} />
          <Num label="₹/scanner-yr" value={cfg.comp.deskAPerScannerAnnual} step={50} onChange={v => setCfg(c => ({ ...c, comp: { ...c.comp, deskAPerScannerAnnual: v } }))} />
          <Num label="B fixed ₹" value={cfg.comp.deskBFixed} step={500} onChange={v => setCfg(c => ({ ...c, comp: { ...c.comp, deskBFixed: v } }))} />
          <Num label="B % of P3/P4" value={cfg.comp.deskBPctP3P4} step={0.005} onChange={v => setCfg(c => ({ ...c, comp: { ...c.comp, deskBPctP3P4: v } }))} />
          <Num label="Clawback days" value={cfg.comp.clawbackDays} onChange={v => setCfg(c => ({ ...c, comp: { ...c.comp, clawbackDays: v } }))} />
        </div>
      </Panel>

      <Panel span={6} title="Channels & spend ramp">
        <DataTable
          cols={[
            { h: 'Channel', render: (ch: typeof cfg.channels[number]) => ch.name.split(' (')[0], csv: ch => ch.name },
            {
              h: 'Plan ₹/mo', num: true, render: ch => ch.paid ? (
                <span style={{ display: 'inline-block', width: 96 }}>
                  <Num value={ch.spendPlanMonthly} step={5000} onChange={v => setCfg(c => ({ ...c, channels: c.channels.map(x => x.id === ch.id ? { ...x, spendPlanMonthly: v } : x) }))} />
                </span>
              ) : <span className="faint">—</span>, csv: ch => ch.spendPlanMonthly,
            },
            {
              h: 'CPL target', num: true, render: ch => ch.paid ? (
                <span style={{ display: 'inline-block', width: 72 }}>
                  <Num value={ch.cplTarget} step={5} onChange={v => setCfg(c => ({ ...c, channels: c.channels.map(x => x.id === ch.id ? { ...x, cplTarget: v } : x) }))} />
                </span>
              ) : <span className="faint">—</span>, csv: ch => ch.cplTarget,
            },
          ]}
          rows={cfg.channels}
        />
        <div className="lbl" style={{ margin: '10px 0 4px' }}>Ad-spend tranches (monthly rate — spend ramps with collections)</div>
        <div className="row" style={{ gap: 6 }}>
          {cfg.spendRampMonthly.map((t, i) => (
            <div key={i} className="row" style={{ gap: 4 }}>
              <label className="field" style={{ flex: '0 0 78px' }}>
                <span className="lbl">≤ week</span>
                <input className="in mono" type="number" value={t.uptoWeek} onChange={e => setCfg(c => ({ ...c, spendRampMonthly: c.spendRampMonthly.map((x, j) => j === i ? { ...x, uptoWeek: parseFloat(e.target.value) || 0 } : x) }))} />
              </label>
              <label className="field" style={{ flex: '0 0 110px' }}>
                <span className="lbl">₹/month</span>
                <input className="in mono" type="number" step={50000} value={t.monthly} onChange={e => setCfg(c => ({ ...c, spendRampMonthly: c.spendRampMonthly.map((x, j) => j === i ? { ...x, monthly: parseFloat(e.target.value) || 0 } : x) }))} />
              </label>
            </div>
          ))}
        </div>
        <div className="formrow" style={{ marginTop: 10 }}>
          <Num label="Fee cap ₹/family/yr" value={cfg.feeCap.capPerFamilyYear} step={1000} onChange={v => setCfg(c => ({ ...c, feeCap: { ...c.feeCap, capPerFamilyYear: v } }))} />
          <Num label="Advance max (months)" value={cfg.feeCap.advanceMaxMonths} onChange={v => setCfg(c => ({ ...c, feeCap: { ...c.feeCap, advanceMaxMonths: v } }))} />
        </div>
        <p className="small dim" style={{ margin: '6px 0 0' }}>Cap default {inr(151000)} (effective 8 Jan 2025, CII-indexed, reviewed 3-yearly) — update here when SEBI revises it.</p>
      </Panel>
    </div>
  )
}

function LiveData() {
  const { cfg, data, setData } = useStore()
  const [paste, setPaste] = useState('')
  const [flash, setFlash] = useFlash()
  const feed = data.feed
  const totals = feed ? feedTotals(feed) : null

  const load = (snap: FeedSnapshot) => {
    const { data: next, result } = applyFeed({ ...data, feed: snap }, snap)
    setData(() => ({ ...next, feed: snap }))
    setFlash(result.notes.join(' '))
  }

  const importPasted = () => {
    try {
      const snap = JSON.parse(paste) as FeedSnapshot
      if (!snap.ads || !snap.campaigns) { setFlash('Not a feed snapshot — needs "ads" and "campaigns" arrays.'); return }
      load(snap); setPaste('')
    } catch { setFlash('Could not parse that as JSON.') }
  }

  return (
    <Panel span={12} title="Live data — the dashboard fetches, it does not ask">
      <div className="row" style={{ gap: 26, marginBottom: 10 }}>
        <Stat label="Feed status" value={feed ? 'connected' : 'not loaded'} tone={feed ? 'good' : undefined}
          sub={feed ? `${feed.source} · pulled ${feed.pulledAt.slice(0, 16).replace('T', ' ')}` : 'load the first pull to see live ad numbers'} />
        {totals && <Stat label="Live CPL" value={totals.cpl ? `₹${totals.cpl.toFixed(2)}` : '—'} tone={totals.cpl && totals.cpl <= cfg.funnel.cplBlended ? 'good' : undefined}
          sub={`${totals.leads} customer leads from ${inr(Math.round(totals.spend))} · hiring counted separately`} />}
        {totals && <Stat label="Brand spend (no lead path)" value={inrC(totals.brandSpend)} sub="LINK_CLICKS objective — clicks a closer cannot work" />}
      </div>
      <div className="row noprint">
        <button className="btn primary" onClick={() => load(FIRST_PULL)}>Load the 10 Aug live pull</button>
        <span className="small dim">Refreshing: ask a Claude session with the Meta connection to “refresh the OPERATOR feed”, then paste the JSON below. Format: <code>docs/DATA-FEED.md</code>.</span>
      </div>
      {flash && <div className="note good" style={{ marginTop: 8 }}>{flash}</div>}
      <div style={{ marginTop: 10 }}>
        <Text area label="Paste a feed snapshot (JSON)" value={paste} onChange={setPaste} placeholder='{"pulledAt":"…","source":"meta:ads-mcp","accounts":[…],"campaigns":[…],"ads":[…],"daily":[…]}' />
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn" disabled={!paste.trim()} onClick={importPasted}>Import snapshot</button>
          {feed && <button className="btn danger" onClick={() => { setData(d => ({ ...d, feed: undefined })); setFlash('Feed cleared.') }}>Clear feed</button>}
        </div>
      </div>
      <p className="small dim" style={{ margin: '8px 0 0' }}>
        A snapshot with per-date rows back-fills the daily logs automatically, so spend and leads never get typed by hand. Locked days are never overwritten. Everything else in the EOD form — collections, dials, per-rep numbers — still comes from the floor until a dialler and gateway feed are wired.
      </p>
    </Panel>
  )
}
