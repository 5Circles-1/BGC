// OPERATOR design tokens — "ledger ink & khata paper".
// Dark-first trading-desk surface in deep indigo; light theme on warm paper.
// Chart categorical slots are the validated 8-slot order (dataviz reference,
// re-validated against these surfaces); status palette is fixed, never themed.

export type ThemeName = 'dark' | 'light'

const dark = {
  bg: '#0F131C',
  panel: '#151B27',
  panel2: '#1B2333',
  panel3: '#222B3E',
  border: '#2A3348',
  borderSoft: '#232B3D',
  ink: '#E9ECF4',
  ink2: '#AAB3C9',
  muted: '#7C8499',
  accent: '#93A8F8',
  accentInk: '#0F131C',
  accentSoft: 'rgba(147,168,248,0.14)',
  grid: '#242D40',
  axis: '#38425C',
  deltaGood: '#0ca30c',
  deltaBad: '#e66767',
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  seq: ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef'],
  divNeg: '#e66767',
  divMid: '#383835',
  divPos: '#3987e5',
}

const light: typeof dark = {
  bg: '#F2F1EB',
  panel: '#FBFAF7',
  panel2: '#F3F2EC',
  panel3: '#EBEAE2',
  border: '#D9D7CB',
  borderSoft: '#E4E2D8',
  ink: '#181B2A',
  ink2: '#4C5165',
  muted: '#83879A',
  accent: '#2743B8',
  accentInk: '#FBFAF7',
  accentSoft: 'rgba(39,67,184,0.10)',
  grid: '#E6E4DA',
  axis: '#C9C7BB',
  deltaGood: '#006300',
  deltaBad: '#d03b3b',
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  seq: ['#104281', '#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef'],
  divNeg: '#d03b3b',
  divMid: '#f0efec',
  divPos: '#2a78d6',
}

// Status is fixed across themes (icon + label always accompany it).
export const STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' }

export const THEMES: Record<ThemeName, typeof dark> = { dark, light }

function cssVars(t: typeof dark): string {
  return [
    `--bg:${t.bg}`, `--panel:${t.panel}`, `--panel2:${t.panel2}`, `--panel3:${t.panel3}`,
    `--border:${t.border}`, `--border-soft:${t.borderSoft}`, `--ink:${t.ink}`, `--ink2:${t.ink2}`,
    `--muted:${t.muted}`, `--accent:${t.accent}`, `--accent-ink:${t.accentInk}`, `--accent-soft:${t.accentSoft}`,
    `--grid:${t.grid}`, `--axis:${t.axis}`, `--delta-good:${t.deltaGood}`, `--delta-bad:${t.deltaBad}`,
    `--s-good:${STATUS.good}`, `--s-warn:${STATUS.warning}`, `--s-serious:${STATUS.serious}`, `--s-crit:${STATUS.critical}`,
  ].join(';')
}

// Dark-first: bare :root carries the complete dark set; light overrides via
// explicit stamp or OS preference (guarded so a dark stamp beats OS-light).
export function themeStyle(): string {
  return [
    `:root{${cssVars(dark)};color-scheme:dark}`,
    `:root[data-theme="light"]{${cssVars(light)};color-scheme:light}`,
    `@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){${cssVars(light)};color-scheme:light}}`,
  ].join('\n')
}

export function resolveTheme(pref: string | null): ThemeName {
  if (pref === 'dark' || pref === 'light') return pref
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}
