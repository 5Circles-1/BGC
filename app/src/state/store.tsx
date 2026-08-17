import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AppData, Config, HeadcountLine, Product } from '../model/types'
import { CEO_DEFAULT_CONFIG, DEFAULT_DATA } from '../model/defaults'
import { sGet, sSet, storageMode } from '../lib/storage'
import { resolveTheme, THEMES, type ThemeName } from '../theme'

interface StoreCtx {
  cfg: Config
  data: AppData
  setCfg: (fn: (c: Config) => Config) => void
  setData: (fn: (d: AppData) => AppData) => void
  resetConfig: () => void
  theme: ThemeName
  tokens: (typeof THEMES)['dark']
  setTheme: (t: ThemeName) => void
  mode: 'local' | 'memory'
}

const Ctx = createContext<StoreCtx | null>(null)

type Rec = Record<string, unknown>
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v)

/** Deep merge where the saved value wins only when its shape matches the default's.
 *  This browser has held every build's storage since day one; a key whose type
 *  changed across versions must fall back to the default instead of poisoning a
 *  screen at render time. Keys the defaults don't know (daily logs, agent runs,
 *  answer records) are carried verbatim. */
function conform<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base
  if (Array.isArray(base)) return (Array.isArray(patch) ? patch : base) as T
  if (isObj(base)) {
    if (!isObj(patch)) return base
    const out: Rec = { ...base }
    for (const [k, v] of Object.entries(patch)) {
      out[k] = k in base && (base as Rec)[k] !== undefined ? conform((base as Rec)[k], v) : v
    }
    return out as T
  }
  return (typeof patch === typeof base ? patch : base) as T
}

// ---- Field-level repair -----------------------------------------------------
// conform() guarantees the skeleton; these guarantee the entries inside the
// arrays every screen maps over. Repair runs on load and on every write, so a
// half-shaped record can never reach a render.

const str = (v: unknown, fb = ''): string => (typeof v === 'string' ? v : fb)
const fin = (v: unknown, fb = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fb)

function numArr(v: unknown, fb: number[]): number[] {
  if (!Array.isArray(v) || v.length === 0) return fb
  const out = v.map(x => (typeof x === 'number' || typeof x === 'string' ? +x : NaN))
  return out.every(Number.isFinite) ? out : fb
}

/** Array of records: drop entries that aren't objects, reshape the rest, and
 *  fall back to the defaults when nothing survives. */
function rows<T>(v: unknown, fb: T[], shape: (r: Rec, i: number) => T): T[] {
  if (!Array.isArray(v)) return fb
  const out = v.filter(isObj).map(shape)
  return out.length ? out : fb
}

function normalizeConfig(c: Config): Config {
  const D = CEO_DEFAULT_CONFIG
  const products = rows<Product>(c.products, D.products, (p, i) => {
    const name = (str(p.name) || str(p.short)).trim() || `Product ${i + 1}`
    const regClass = p.regClass === 'research' || p.regClass === 'saas' ? p.regClass : 'education'
    return {
      id: str(p.id) || `prod${i + 1}`,
      name,
      short: str(p.short).trim() || name,
      priceInclGst: fin(p.priceInclGst),
      unitsPlanMonthly: fin(p.unitsPlanMonthly),
      desk: p.desk === 'B' ? 'B' : 'A',
      regClass,
      countsTowardCap: typeof p.countsTowardCap === 'boolean' ? p.countsTowardCap : regClass === 'research',
      termMonths: fin(p.termMonths),
      // Absent means the field predates this save, not that the product is deferred.
      shipsDay1: typeof p.shipsDay1 === 'boolean' ? p.shipsDay1 : true,
      ...(str(p.note) ? { note: str(p.note) } : {}),
    }
  })
  const has = (id: string) => products.some(p => p.id === id)
  const firstA = products.find(p => p.desk === 'A') ?? products[0]
  return {
    ...c,
    products,
    anchorProductId: has(c.anchorProductId) ? c.anchorProductId : (firstA?.id ?? ''),
    bumpProductId: has(c.bumpProductId) ? c.bumpProductId : '',
    target: { ...c.target, runRatePlanWeekly: numArr(c.target.runRatePlanWeekly, D.target.runRatePlanWeekly) },
    ramp: { curveByWeek: numArr(c.ramp.curveByWeek, D.ramp.curveByWeek) },
    channels: rows(c.channels, D.channels, (ch, i) => ({
      id: str(ch.id) || `ch${i + 1}`,
      name: str(ch.name) || `Channel ${i + 1}`,
      spendPlanMonthly: fin(ch.spendPlanMonthly),
      cplTarget: fin(ch.cplTarget),
      paid: !!ch.paid,
    })),
    spendRampMonthly: rows(c.spendRampMonthly, D.spendRampMonthly, r => ({ uptoWeek: fin(r.uptoWeek), monthly: fin(r.monthly) })),
    opex: rows(c.opex, D.opex, (r, i) => ({ name: str(r.name) || `Line ${i + 1}`, monthly: fin(r.monthly) })),
    headcountPlan: rows(c.headcountPlan, D.headcountPlan, r => ({
      fn: str(r.fn, 'sales') as HeadcountLine['fn'], role: str(r.role), planned: fin(r.planned),
    })),
  }
}

const RECORD_KEYS = ['daily', 'agents', 'wbr', 'exerciseLog'] as const

function normalizeData(d: AppData): AppData {
  let out: AppData | null = null
  const touch = (): AppData => (out ??= { ...d })

  // Collections are arrays of objects; a stray null/number entry crashes maps.
  for (const [k, dv] of Object.entries(DEFAULT_DATA)) {
    if (!Array.isArray(dv)) continue
    const cur = (d as unknown as Rec)[k]
    if (Array.isArray(cur) && cur.some(x => !isObj(x))) (touch() as unknown as Rec)[k] = cur.filter(isObj)
  }
  // Keyed records: drop non-object values, keep the rest verbatim.
  for (const k of RECORD_KEYS) {
    const cur = d[k] as unknown as Rec
    if (isObj(cur) && Object.values(cur).some(v => !isObj(v))) {
      const clean: Rec = {}
      for (const [kk, vv] of Object.entries(cur)) if (isObj(vv)) clean[kk] = vv
      ;(touch() as unknown as Rec)[k] = clean
    }
  }
  // The feed is imported JSON — the one blob a human can paste. Validate or drop.
  const f = d.feed as unknown
  if (f !== undefined) {
    const fr = f as Rec
    const ok = isObj(f) && typeof fr.pulledAt === 'string' && typeof fr.source === 'string'
      && Array.isArray(fr.ads) && Array.isArray(fr.campaigns) && Array.isArray(fr.accounts)
    if (!ok) touch().feed = undefined
    else {
      const dirty = (fr.ads as unknown[]).some(x => !isObj(x)) || (fr.campaigns as unknown[]).some(x => !isObj(x))
        || (fr.accounts as unknown[]).some(x => !isObj(x))
        || (fr.daily !== undefined && (!Array.isArray(fr.daily) || (fr.daily as unknown[]).some(r => !isObj(r) || typeof (r as Rec).date !== 'string')))
      if (dirty) {
        touch().feed = {
          ...(fr as unknown as NonNullable<AppData['feed']>),
          ads: (fr.ads as unknown[]).filter(isObj) as unknown as NonNullable<AppData['feed']>['ads'],
          campaigns: (fr.campaigns as unknown[]).filter(isObj) as unknown as NonNullable<AppData['feed']>['campaigns'],
          accounts: (fr.accounts as unknown[]).filter(isObj) as unknown as NonNullable<AppData['feed']>['accounts'],
          daily: Array.isArray(fr.daily)
            ? ((fr.daily as unknown[]).filter(r => isObj(r) && typeof (r as Rec).date === 'string') as unknown as NonNullable<AppData['feed']>['daily'])
            : undefined,
        }
      }
    }
  }
  return out ?? d
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfgState] = useState<Config>(() => normalizeConfig(conform(CEO_DEFAULT_CONFIG, sGet<unknown>('config', null))))
  const [data, setDataState] = useState<AppData>(() => normalizeData(conform(DEFAULT_DATA, sGet<unknown>('data', null))))
  const [theme, setThemeState] = useState<ThemeName>(() => resolveTheme(sGet<string | null>('theme', null)))

  const cfgTimer = useRef<number | undefined>(undefined); const dataTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(cfgTimer.current)
    cfgTimer.current = window.setTimeout(() => sSet('config', cfg), 250)
  }, [cfg])
  useEffect(() => {
    window.clearTimeout(dataTimer.current)
    dataTimer.current = window.setTimeout(() => sSet('data', data), 250)
  }, [data])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    sSet('theme', theme)
  }, [theme])

  const value = useMemo<StoreCtx>(() => ({
    cfg, data,
    setCfg: fn => setCfgState(c => normalizeConfig(fn(c))),
    setData: fn => setDataState(d => normalizeData(fn(d))),
    resetConfig: () => setCfgState(CEO_DEFAULT_CONFIG),
    theme, tokens: THEMES[theme],
    setTheme: setThemeState,
    mode: storageMode(),
  }), [cfg, data, theme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
