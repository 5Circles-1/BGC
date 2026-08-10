// Indian-system number formatting. All money figures in the UI flow through here.

export function inr(n: number, opts?: { paise?: boolean; sign?: boolean }): string {
  if (!isFinite(n)) return '—'
  const sign = n < 0 ? '−' : opts?.sign && n > 0 ? '+' : ''
  const abs = Math.abs(n)
  const fixed = opts?.paise ? abs.toFixed(2) : Math.round(abs).toString()
  const [intPart, dec] = fixed.split('.')
  let out = intPart
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3)
    let rest = intPart.slice(0, -3)
    const groups: string[] = []
    while (rest.length > 2) { groups.unshift(rest.slice(-2)); rest = rest.slice(0, -2) }
    if (rest) groups.unshift(rest)
    out = groups.join(',') + ',' + last3
  }
  return `${sign}₹${out}${dec ? '.' + dec : ''}`
}

// Compact lakh/crore form for dense chips: ₹25.0L, ₹1.2Cr, ₹96.8k
export function inrC(n: number, opts?: { sign?: boolean }): string {
  if (!isFinite(n)) return '—'
  const sign = n < 0 ? '−' : opts?.sign && n > 0 ? '+' : ''
  const a = Math.abs(n)
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(a >= 1e8 ? 1 : 2)}Cr`
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(a >= 1e6 ? 1 : 2)}L`
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`
  return `${sign}₹${Math.round(a)}`
}

export function num(n: number, dp = 0): string {
  if (!isFinite(n)) return '—'
  return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
}

export function pct(n: number, dp = 1): string {
  if (!isFinite(n)) return '—'
  return `${(n * 100).toFixed(dp)}%`
}

export const DAY_MS = 86400000

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function todayISO(): string { return iso(new Date()) }

export function fmtDate(s: string): string {
  const d = parseISO(s)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
export function fmtDateFull(s: string): string {
  const d = parseISO(s)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d)
}
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY_MS)
}
export function isSunday(s: string): boolean { return parseISO(s).getDay() === 0 }

/** Working days (Mon–Sat) in [from, to] inclusive. */
export function workingDaysBetween(from: string, to: string): number {
  let c = 0
  for (let d = from; d <= to; d = addDays(d, 1)) if (!isSunday(d)) c++
  return c
}

export function clamp(n: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, n)) }

let idc = 0
export function uid(prefix = 'id'): string {
  idc = (idc + 1) % 1000
  return `${prefix}_${Date.now().toString(36)}${idc.toString(36)}`
}
