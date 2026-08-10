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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfgState] = useState<Config>(() => mergeDeep(CEO_DEFAULT_CONFIG, sGet<Partial<Config> | null>('config', null)))
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
    setCfg: fn => setCfgState(c => fn(c)),
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
