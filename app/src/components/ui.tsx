import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadCSV } from '../lib/csv'

export function Panel({ title, right, span = 12, children, className = '' }: {
  title?: React.ReactNode; right?: React.ReactNode; span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12
  children: React.ReactNode; className?: string
}) {
  return (
    <section className={`panel c${span} ${className}`}>
      {(title || right) && (
        <div className="head">
          {title && <span className="lbl">{title}</span>}
          <span className="spacer" />
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, hero, tone }: {
  label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; hero?: boolean
  tone?: 'good' | 'bad'
}) {
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className={`big ${hero ? 'hero' : ''} ${tone === 'good' ? 'delta-good' : tone === 'bad' ? 'delta-bad' : ''}`}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

export function Pill({ kind, children }: { kind: 'good' | 'warn' | 'serious' | 'crit' | 'acc' | 'plain'; children: React.ReactNode }) {
  return <span className={`pill ${kind === 'plain' ? '' : kind}`}><span className="dot" aria-hidden />{children}</span>
}

export function Progress({ value, tone }: { value: number; tone?: 'g' | 'w' | 'c' }) {
  return <div className={`bar ${tone ?? ''}`}><i style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} /></div>
}

export type Col<T> = { h: string; num?: boolean; render: (row: T, i: number) => React.ReactNode; csv?: (row: T) => string | number }
export function DataTable<T>({ cols, rows, csvName, sumRow, empty }: {
  cols: Col<T>[]; rows: T[]; csvName?: string; sumRow?: React.ReactNode[]; empty?: string
}) {
  return (
    <div className="twrap">
      {csvName && rows.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button className="btn sm noprint" onClick={() => downloadCSV(csvName, cols.map(c => c.h), rows.map(r => cols.map(c => c.csv ? c.csv(r) : plain(c.render(r, 0)))))}>
            <Download size={12} /> CSV
          </button>
        </div>
      )}
      <table className="t">
        <thead><tr>{cols.map((c, i) => <th key={i} className={c.num ? 'num' : ''}>{c.h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length}><div className="empty">{empty ?? 'Nothing here yet.'}</div></td></tr>}
          {rows.map((r, i) => <tr key={i}>{cols.map((c, j) => <td key={j} className={c.num ? 'num' : ''}>{c.render(r, i)}</td>)}</tr>)}
          {sumRow && rows.length > 0 && <tr className="sum">{sumRow.map((cell, i) => <td key={i} className={cols[i]?.num ? 'num' : ''}>{cell}</td>)}</tr>}
        </tbody>
      </table>
    </div>
  )
}
function plain(n: React.ReactNode): string {
  if (n == null || typeof n === 'boolean') return ''
  if (typeof n === 'string' || typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(plain).join(' ')
  if (React.isValidElement(n)) return plain((n.props as { children?: React.ReactNode }).children)
  return ''
}

export function Num({ label, value, onChange, step = 1, suffix, width }: {
  label?: string; value: number; onChange: (v: number) => void; step?: number; suffix?: string; width?: number
}) {
  return (
    <label className="field" style={width ? { flex: `0 0 ${width}px` } : undefined}>
      {label && <span className="lbl">{label}{suffix ? ` (${suffix})` : ''}</span>}
      <input className="in mono" type="number" value={Number.isFinite(value) ? +value.toFixed(6) : 0} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </label>
  )
}

export function Text({ label, value, onChange, placeholder, area }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean
}) {
  return (
    <label className="field">
      {label && <span className="lbl">{label}</span>}
      {area
        ? <textarea className="in" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        : <input className="in" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
    </label>
  )
}

export function Select({ label, value, onChange, options }: {
  label?: string; value: string; onChange: (v: string) => void; options: [string, string][]
}) {
  return (
    <label className="field">
      {label && <span className="lbl">{label}</span>}
      <select className="in" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  )
}

export function Tabs({ tabs, on, set }: { tabs: [string, string][]; on: string; set: (t: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={on === id} className={`tab ${on === id ? 'on' : ''}`} onClick={() => set(id)}>{label}</button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-label={title}>
        <div className="head" style={{ display: 'flex', marginBottom: 12 }}>
          <span className="lbl">{title}</span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function useFlash(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  return [msg, (m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 2600) }]
}
