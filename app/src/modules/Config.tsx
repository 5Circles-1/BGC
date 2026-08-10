import React, { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '../state/store'
import { Panel, Num, Text, Select, DataTable, useFlash, Pill } from '../components/ui'
import { inr, inrC } from '../lib/format'
import { exportAll, importAll, wipeAll, downloadFile } from '../lib/storage'
import { planRevenueMonthly } from '../model/engine'

export default function Config() {
  const { cfg, setCfg, resetConfig, mode, theme, setTheme } = useStore()
  const [flash, setFlash] = useFlash()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const plan = planRevenueMonthly(cfg)

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

      <Panel span={12} title={`Product ladder — plan mix totals ${inrC(plan.total)}/mo (A ${inrC(plan.deskA)} · B ${inrC(plan.deskB)})`}>
        <DataTable
          csvName="product_config"
          cols={[
            { h: 'Product', render: (p: typeof cfg.products[number]) => <span><strong>{p.short}</strong><span className="small faint" style={{ display: 'block' }}>{p.name}</span></span>, csv: p => p.name },
            { h: 'Class', render: p => <Pill kind={p.regClass === 'research' ? 'acc' : 'plain'}>{p.regClass}</Pill>, csv: p => p.regClass },
            { h: 'Desk', render: p => p.desk, csv: p => p.desk },
            {
              h: 'Price incl. GST', num: true, render: p => (
                <span style={{ display: 'inline-block', width: 104 }}>
                  <Num value={p.priceInclGst} step={100} onChange={v => setCfg(c => ({ ...c, products: c.products.map(x => x.id === p.id ? { ...x, priceInclGst: v } : x) }))} />
                </span>
              ), csv: p => p.priceInclGst,
            },
            {
              h: 'Units/mo plan', num: true, render: p => (
                <span style={{ display: 'inline-block', width: 88 }}>
                  <Num value={p.unitsPlanMonthly} onChange={v => setCfg(c => ({ ...c, products: c.products.map(x => x.id === p.id ? { ...x, unitsPlanMonthly: v } : x) }))} />
                </span>
              ), csv: p => p.unitsPlanMonthly,
            },
            { h: 'Revenue/mo', num: true, render: p => inrC(p.priceInclGst * p.unitsPlanMonthly), csv: p => p.priceInclGst * p.unitsPlanMonthly },
            { h: 'Term', num: true, render: p => p.termMonths ? `${p.termMonths}m` : 'one-time', csv: p => p.termMonths },
            { h: 'Fee cap', render: p => p.countsTowardCap ? <Pill kind="warn">counts</Pill> : <span className="faint small">outside</span>, csv: p => p.countsTowardCap ? 'counts' : 'outside' },
          ]}
          rows={cfg.products}
        />
        <p className="small dim" style={{ margin: '8px 0 0' }}>The Lite/Pro split is deliberate: user-defined conditions = tool (education brand, no cap); entry/SL/target signals = research service (RA entity, cap, KYC, sign-off). If the user sets the condition it is a tool; if you set it and tell them to act, it is research.</p>
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
