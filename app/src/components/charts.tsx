import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, BarChart, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend, Cell,
} from 'recharts'
import { useStore } from '../state/store'
import { inrC } from '../lib/format'

export function useViz() {
  const { tokens } = useStore()
  return tokens
}

const tipStyle = (t: ReturnType<typeof useViz>): React.CSSProperties => ({
  background: t.panel2, border: `1px solid ${t.border}`, borderRadius: 3,
  fontSize: 12, fontFamily: "'Plex Mono', monospace", padding: '6px 9px', color: t.ink,
})

function money(v: unknown): string { return typeof v === 'number' ? inrC(v) : String(v ?? '') }

const axisProps = (t: ReturnType<typeof useViz>) => ({
  stroke: t.axis, tick: { fill: t.muted, fontSize: 10.5, fontFamily: "'Plex Mono', monospace" }, tickLine: false, axisLine: { stroke: t.axis },
})

/** Burn-up: required cumulative (dashed reference) vs actual (filled). */
export function PaceChart({ data, height = 230 }: { data: { day: number; required: number; actual: number | null }[]; height?: number }) {
  const t = useViz()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey="day" {...axisProps(t)} interval={9} tickFormatter={(d: number) => `D${d}`} />
        <YAxis {...axisProps(t)} tickFormatter={(v: number) => inrC(v)} width={54} />
        <Tooltip contentStyle={tipStyle(t)} formatter={(v: unknown, name: unknown) => [money(v), name === 'required' ? 'Required' : 'Actual']} labelFormatter={(d: unknown) => `Day ${d}`} isAnimationActive={false} />
        <Area type="monotone" dataKey="actual" stroke={t.series[0]} strokeWidth={2} fill={t.series[0]} fillOpacity={0.16} connectNulls={false} isAnimationActive={false} dot={false} />
        <Line type="monotone" dataKey="required" stroke={t.ink2} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/** Monte Carlo histogram with target line. */
export function McHistogram({ bins, target, p50, height = 200 }: {
  bins: { x0: number; x1: number; count: number }[]; target: number; p50: number; height?: number
}) {
  const t = useViz()
  const data = bins.map(b => ({ mid: (b.x0 + b.x1) / 2, count: b.count }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 4 }} barCategoryGap={1}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey="mid" {...axisProps(t)} tickFormatter={(v: number) => inrC(v)} interval={5} />
        <YAxis {...axisProps(t)} width={34} allowDecimals={false} />
        <Tooltip contentStyle={tipStyle(t)} formatter={(v: unknown) => [String(v), 'runs']} labelFormatter={(v: unknown) => money(v)} isAnimationActive={false} />
        <Bar dataKey="count" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.mid >= target ? t.series[2] : t.series[0]} fillOpacity={0.9} />)}
        </Bar>
        <ReferenceLine x={target} stroke={t.deltaBad} strokeWidth={1.5} label={{ value: 'target', fill: t.ink2, fontSize: 10, position: 'top' }} />
        <ReferenceLine x={p50} stroke={t.ink2} strokeDasharray="4 3" label={{ value: 'P50', fill: t.muted, fontSize: 10, position: 'top' }} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Generic multi-series bars over a date-ish axis (stacked or grouped). */
export function SeriesBars({ data, series, xKey, stacked, height = 210, moneyFmt = true }: {
  data: Record<string, unknown>[]; series: { key: string; name: string }[]; xKey: string
  stacked?: boolean; height?: number; moneyFmt?: boolean
}) {
  const t = useViz()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 4 }} barCategoryGap="22%">
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps(t)} />
        <YAxis {...axisProps(t)} tickFormatter={(v: number) => (moneyFmt ? inrC(v) : String(v))} width={52} />
        <Tooltip contentStyle={tipStyle(t)} formatter={(v: unknown, n: unknown) => [moneyFmt ? money(v) : String(v), String(n)]} isAnimationActive={false} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11.5, color: t.ink2 }} iconSize={9} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId={stacked ? 'a' : undefined}
            fill={t.series[i % t.series.length]} isAnimationActive={false}
            radius={stacked ? (i === series.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]) : [2, 2, 0, 0]}
            stroke={t.panel} strokeWidth={stacked ? 1.5 : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Single line (cash runway, trend). */
export function TrendLine({ data, xKey, yKey, height = 190, refY, refLabel }: {
  data: Record<string, unknown>[]; xKey: string; yKey: string; height?: number; refY?: number; refLabel?: string
}) {
  const t = useViz()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps(t)} interval={Math.max(0, Math.floor(data.length / 8))} />
        <YAxis {...axisProps(t)} tickFormatter={(v: number) => inrC(v)} width={56} />
        <Tooltip contentStyle={tipStyle(t)} formatter={(v: unknown) => [money(v), '']} isAnimationActive={false} />
        {refY !== undefined && <ReferenceLine y={refY} stroke={t.deltaBad} strokeDasharray="4 3" label={{ value: refLabel, fill: t.muted, fontSize: 10 }} />}
        <Line type="monotone" dataKey={yKey} stroke={t.series[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/** Tiny inline sparkline (SVG, no axes) for stat tiles. */
export function Spark({ values, width = 110, height = 26, good }: { values: number[]; width?: number; height?: number; good?: boolean }) {
  const t = useViz()
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values)
  const r = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / r) * (height - 5)}`).join(' ')
  const color = good === undefined ? t.series[0] : good ? t.deltaGood : t.deltaBad
  const last = pts.split(' ').pop()!.split(',')
  return (
    <svg width={width} height={height} aria-hidden style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} />
    </svg>
  )
}
