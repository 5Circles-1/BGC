// Monte Carlo over the sprint forecast. Deterministic (seeded) so a given
// config always reproduces the same distribution.
import type { Config, Rep } from './types'
import { forecastSprint } from './engine'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normal(rng: () => number, mean: number, sd: number, clampSd = 2.5): number {
  const u1 = Math.max(1e-12, rng()), u2 = rng()
  let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  z = Math.max(-clampSd, Math.min(clampSd, z))
  return mean + z * sd * mean
}

export interface McResult {
  runs: number
  p10: number; p50: number; p90: number
  pHit: number
  sprintP10: number; sprintP50: number; sprintP90: number
  histogram: { x0: number; x1: number; count: number }[]
  targetEff: number
}

export function monteCarlo(cfg: Config, reps: Rep[], seed = 20260811): McResult {
  const rng = mulberry32(seed)
  const n = Math.max(500, Math.min(20000, cfg.mc.runs))
  const day60: number[] = new Array(n)
  const sprint: number[] = new Array(n)
  const targetEff = cfg.target.basis === 'net' ? cfg.target.monthlyRunRate * (1 + cfg.target.gstRate) : cfg.target.monthlyRunRate
  let hits = 0
  for (let i = 0; i < n; i++) {
    const f = forecastSprint(cfg, reps, {
      closeMult: Math.max(0.2, normal(rng, 1, cfg.mc.sdClose)),
      cplMult: Math.max(0.4, normal(rng, 1, cfg.mc.sdCpl)),
      rampMult: Math.max(0.4, normal(rng, 1, cfg.mc.sdRamp)),
      aovMult: Math.max(0.6, normal(rng, 1, cfg.mc.sdAov)),
      organicMult: Math.max(0.2, normal(rng, 1, 0.25)),
      deskBMult: Math.max(0.3, normal(rng, 1, 0.18)),
      joinDelayDays: Math.max(0, normal(rng, 1, 3) * 3),
    })
    day60[i] = f.day60RunRate
    sprint[i] = f.sprintTotal
    if (f.day60RunRate >= targetEff) hits++
  }
  day60.sort((a, b) => a - b)
  sprint.sort((a, b) => a - b)
  const q = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))]

  const lo = day60[0], hi = day60[day60.length - 1]
  const bins = 26
  const w = (hi - lo) / bins || 1
  const histogram = Array.from({ length: bins }, (_, b) => ({ x0: lo + b * w, x1: lo + (b + 1) * w, count: 0 }))
  for (const v of day60) {
    const b = Math.min(bins - 1, Math.floor((v - lo) / w))
    histogram[b].count++
  }
  return {
    runs: n,
    p10: q(day60, 0.10), p50: q(day60, 0.50), p90: q(day60, 0.90),
    pHit: hits / n,
    sprintP10: q(sprint, 0.10), sprintP50: q(sprint, 0.50), sprintP90: q(sprint, 0.90),
    histogram, targetEff,
  }
}
