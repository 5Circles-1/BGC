// Persistence layer. The brief specifies a get/set/delete/list contract; this
// implements it over localStorage (works when the file is opened directly or
// hosted), degrading to an in-memory map when storage is unavailable (e.g. a
// sandboxed embed). The UI surfaces which mode is active; JSON backup/restore
// is the durability guarantee either way.

const PREFIX = 'bos:'

let mem: Map<string, string> | null = null

function backend(): Storage | Map<string, string> {
  if (mem) return mem
  try {
    const t = '__bos_probe__'
    window.localStorage.setItem(t, '1')
    window.localStorage.removeItem(t)
    return window.localStorage
  } catch {
    mem = new Map()
    return mem
  }
}

export function storageMode(): 'local' | 'memory' {
  return backend() instanceof Map ? 'memory' : 'local'
}

export function sGet<T>(key: string, fallback: T): T {
  try {
    const b = backend()
    const raw = b instanceof Map ? b.get(PREFIX + key) : b.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch { return fallback }
}

export function sSet(key: string, value: unknown): boolean {
  try {
    const raw = JSON.stringify(value)
    const b = backend()
    if (b instanceof Map) b.set(PREFIX + key, raw)
    else b.setItem(PREFIX + key, raw)
    return true
  } catch { return false }
}

export function sDelete(key: string): void {
  try {
    const b = backend()
    if (b instanceof Map) b.delete(PREFIX + key)
    else b.removeItem(PREFIX + key)
  } catch { /* ignore */ }
}

export function sList(): string[] {
  try {
    const b = backend()
    if (b instanceof Map) return [...b.keys()].filter(k => k.startsWith(PREFIX)).map(k => k.slice(PREFIX.length))
    const out: string[] = []
    for (let i = 0; i < b.length; i++) {
      const k = b.key(i)
      if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length))
    }
    return out
  } catch { return [] }
}

export function exportAll(): string {
  const dump: Record<string, unknown> = {}
  for (const k of sList()) dump[k] = sGet(k, null)
  return JSON.stringify({ app: 'OPERATOR', version: 2, exportedAt: new Date().toISOString(), data: dump }, null, 2)
}

export function importAll(json: string): { ok: boolean; keys: number; error?: string } {
  try {
    const parsed = JSON.parse(json)
    const data = parsed?.data
    if (!data || typeof data !== 'object') return { ok: false, keys: 0, error: 'Not an OPERATOR backup file (missing data block).' }
    let n = 0
    for (const [k, v] of Object.entries(data)) { if (sSet(k, v)) n++ }
    return { ok: true, keys: n }
  } catch (e) {
    return { ok: false, keys: 0, error: 'Could not parse the file as JSON.' }
  }
}

export function wipeAll(): void {
  for (const k of sList()) sDelete(k)
}

// File download: prefers the artifact runtime's downloads capability when the
// page is published on claude.ai; otherwise a plain anchor download.
declare global {
  interface Window { claude?: { downloads?: { save: (a: { filename: string; data: string }) => Promise<unknown> } } }
}

export async function downloadFile(filename: string, data: string, mime = 'application/json'): Promise<'saved' | 'declined' | 'anchor'> {
  const cap = window.claude?.downloads
  if (cap?.save) {
    try { await cap.save({ filename, data }); return 'saved' } catch { return 'declined' }
  }
  const blob = new Blob([data], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'anchor'
}
