import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AppData, Config } from '../model/types'
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

function mergeDeep<T>(base: T, patch: unknown): T {
  if (patch == null || typeof patch !== 'object' || Array.isArray(patch)) return (patch ?? base) as T
  if (typeof base !== 'object' || base == null || Array.isArray(base)) return patch as T
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    out[k] = k in (base as Record<string, unknown>) ? mergeDeep((base as Record<string, unknown>)[k], v) : v
  }
  return out as T
}

/** Saved configs are older than the code that reads them. mergeDeep replaces arrays
 *  wholesale, so a products array stored before a field existed comes back missing it —
 *  which is how every product started reading "deferred". Repair on the way in, and
 *  on every write, so a config can never be half-shaped. */
function normalizeConfig(c: Config): Config {
  const products = (Array.isArray(c.products) ? c.products : CEO_DEFAULT_CONFIG.products).map((p, i) => {
    const name = (p.name ?? p.short ?? '').trim() || `Product ${i + 1}`
    return {
      ...p,
      id: p.id || `prod${i + 1}`,
      name,
      short: (p.short ?? '').trim() || name,
      priceInclGst: Number.isFinite(p.priceInclGst) ? p.priceInclGst : 0,
      unitsPlanMonthly: Number.isFinite(p.unitsPlanMonthly) ? p.unitsPlanMonthly : 0,
      desk: p.desk === 'B' ? 'B' as const : 'A' as const,
      regClass: p.regClass ?? 'education',
      countsTowardCap: p.countsTowardCap ?? p.regClass === 'research',
      termMonths: Number.isFinite(p.termMonths) ? p.termMonths : 0,
      // Absent means the field predates this save, not that the product is deferred.
      shipsDay1: typeof p.shipsDay1 === 'boolean' ? p.shipsDay1 : true,
    }
  })
  const has = (id: string) => products.some(p => p.id === id)
  const firstA = products.find(p => p.desk === 'A') ?? products[0]
  return {
    ...c,
    products,
    anchorProductId: has(c.anchorProductId) ? c.anchorProductId : (firstA?.id ?? ''),
    bumpProductId: has(c.bumpProductId) ? c.bumpProductId : '',
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfgState] = useState<Config>(() => normalizeConfig(mergeDeep(CEO_DEFAULT_CONFIG, sGet<Partial<Config> | null>('config', null))))
  const [data, setDataState] = useState<AppData>(() => mergeDeep(DEFAULT_DATA, sGet<Partial<AppData> | null>('data', null)))
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
    setData: fn => setDataState(d => fn(d)),
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
