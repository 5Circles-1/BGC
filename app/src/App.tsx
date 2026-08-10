import React, { useMemo, useState } from 'react'
import {
  Gauge, Sigma, IndianRupee, PhoneCall, Magnet, Megaphone, Users, GraduationCap,
  ShieldCheck, Landmark, PackageCheck, CalendarClock, Bot, ClipboardList, Settings2, CircleHelp,
  Moon, Sun, Rocket,
} from 'lucide-react'
import { useStore } from './state/store'
import { todayISO, inrC, pct, diffDays } from './lib/format'
import { pacing, sprintCal } from './model/engine'
import { monteCarlo } from './model/monteCarlo'
import { sGet, sSet } from './lib/storage'
import M01 from './modules/M01Command'
import M02 from './modules/M02Quant'
import M03 from './modules/M03Revenue'
import M04 from './modules/M04Sales'
import M05 from './modules/M05Leads'
import M06 from './modules/M06Marketing'
import M07 from './modules/M07Hiring'
import M08 from './modules/M08Academy'
import M09 from './modules/M09Compliance'
import M10 from './modules/M10Finance'
import M11 from './modules/M11Ops'
import M12 from './modules/M12Ritual'
import M13 from './modules/M13Agents'
import M14 from './modules/M14WBR'
import Config from './modules/Config'
import Discovery from './modules/Discovery'
import M00 from './modules/M00Readiness'

const NAV: { id: string; label: string; k: string; icon: React.ComponentType<{ size?: number }>; group?: string }[] = [
  { id: 'm0', label: 'Launch Readiness', k: 'M0', icon: Rocket },
  { id: 'm1', label: 'Command Center', k: 'M1', icon: Gauge },
  { id: 'm2', label: 'Quant Engine', k: 'M2', icon: Sigma },
  { id: 'm3', label: 'Revenue & P&L', k: 'M3', icon: IndianRupee, group: 'Revenue' },
  { id: 'm4', label: 'Sales Command', k: 'M4', icon: PhoneCall },
  { id: 'm5', label: 'Lead Engine', k: 'M5', icon: Magnet },
  { id: 'm6', label: 'Marketing & Creative', k: 'M6', icon: Megaphone, group: 'Growth' },
  { id: 'm7', label: 'HR & Hiring', k: 'M7', icon: Users },
  { id: 'm8', label: 'Sales Academy', k: 'M8', icon: GraduationCap },
  { id: 'm9', label: 'Compliance Vault', k: 'M9', icon: ShieldCheck, group: 'Control' },
  { id: 'm10', label: 'Finance & Cash', k: 'M10', icon: Landmark },
  { id: 'm11', label: 'Ops & Delivery', k: 'M11', icon: PackageCheck },
  { id: 'm12', label: 'Daily Ritual', k: 'M12', icon: CalendarClock, group: 'Intelligence' },
  { id: 'm13', label: 'Agent Console', k: 'M13', icon: Bot },
  { id: 'm14', label: 'Weekly Review', k: 'M14', icon: ClipboardList },
  { id: 'discovery', label: 'Discovery', k: 'Q', icon: CircleHelp, group: 'Model' },
  { id: 'config', label: 'Config', k: '⚙', icon: Settings2 },
]

export default function App() {
  const { cfg, data, theme, setTheme, mode } = useStore()
  // During the readiness runway the prep board is the home screen, not the sprint dashboard.
  const [view, setView] = useState<string>(() => sGet('view', todayISO() <= cfg.prep.endDate ? 'm0' : 'm1'))
  const go = (m: string) => { setView(m); sSet('view', m); window.scrollTo(0, 0) }

  const today = todayISO()
  const inPrep = today <= cfg.prep.endDate
  const cal = useMemo(() => sprintCal(cfg, today), [cfg, today])
  const pace = useMemo(() => pacing(cfg, data, today), [cfg, data, today])
  const mc = useMemo(() => monteCarlo(cfg, data.reps), [cfg, data.reps])

  const discoveryOpen = !data.discovery.confirmed

  return (
    <div className="shell">
      <nav className="rail noprint" aria-label="Modules">
        <div className="wordmark">
          <span className="t" style={{ color: 'var(--accent)' }}>OPERATOR</span>
          <span className="v mono">v2 · {cfg.entity.brand}</span>
        </div>
        {NAV.map(n => (
          <React.Fragment key={n.id}>
            {n.group && <div className="navgrp lbl">{n.group}</div>}
            <button className={`navitem ${view === n.id ? 'on' : ''}`} onClick={() => go(n.id)} aria-current={view === n.id ? 'page' : undefined}>
              <n.icon size={15} /> {n.label}
              <span className="k">{n.k}</span>
            </button>
          </React.Fragment>
        ))}
        <div className="railfoot" style={{ marginTop: 'auto', padding: '10px 8px 2px' }}>
          <div className="small faint">SEBI RA {cfg.entity.sebiReg || '—'}</div>
          <div className="small faint">Investments in securities market are subject to market risks.</div>
        </div>
      </nav>

      <div className="main">
        <header className="topbar noprint">
          <div className="topstat">
            <span className="lbl">{inPrep ? 'Readiness' : 'Day'}</span>
            <span className="val">
              {inPrep
                ? <>T−{Math.max(0, diffDays(today, cfg.prep.endDate))}<span className="dim"> to Day 1</span></>
                : <>D{cal.dayIndex}<span className="dim">/{cal.days}</span></>}
            </span>
          </div>
          <div className="topstat">
            <span className="lbl">₹/working day needed</span>
            <span className="val">{inrC(pace.requiredPerRemainingWD)}</span>
          </div>
          <div className="topstat">
            <span className="lbl">Cumulative vs line</span>
            <span className={`val ${pace.variance >= 0 ? 'delta-good' : 'delta-bad'}`}>{inrC(pace.variance, { sign: true })}</span>
          </div>
          <div className="topstat">
            <span className="lbl">Run-rate (7wd)</span>
            <span className="val">{inrC(pace.currentRunRate)}</span>
          </div>
          <div className="topstat">
            <span className="lbl">P(₹25L)</span>
            <span className={`val ${mc.pHit >= 0.5 ? 'delta-good' : ''}`}>{pct(mc.pHit, 0)}</span>
          </div>
          <span style={{ flex: 1 }} />
          {discoveryOpen && (
            <button className="pill warn" style={{ cursor: 'pointer' }} onClick={() => go('discovery')}>
              <span className="dot" /> Discovery unanswered — model runs on defaults
            </button>
          )}
          {mode === 'memory' && <span className="pill crit"><span className="dot" /> memory-only: export backups</span>}
          <button className="btn sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </header>

        <main className="content">
          {view === 'm0' && <M00 />}
          {view === 'm1' && <M01 go={go} />}
          {view === 'm2' && <M02 />}
          {view === 'm3' && <M03 />}
          {view === 'm4' && <M04 />}
          {view === 'm5' && <M05 />}
          {view === 'm6' && <M06 />}
          {view === 'm7' && <M07 />}
          {view === 'm8' && <M08 />}
          {view === 'm9' && <M09 />}
          {view === 'm10' && <M10 />}
          {view === 'm11' && <M11 />}
          {view === 'm12' && <M12 />}
          {view === 'm13' && <M13 />}
          {view === 'm14' && <M14 />}
          {view === 'discovery' && <Discovery />}
          {view === 'config' && <Config />}
        </main>
      </div>
    </div>
  )
}
