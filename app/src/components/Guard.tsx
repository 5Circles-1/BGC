import React from 'react'
import { downloadFile, exportAll, sSet, wipeAll } from '../lib/storage'

/** The rule this component enforces: no screen error may ever black out the tool.
 *  A crash renders a recovery card that names the error (so a screenshot is a
 *  full bug report), and the saved view is re-pointed home so simply reopening
 *  the file can never land back on a crashed screen. */
interface Props {
  level: 'app' | 'screen'
  resetKey?: string
  onHome?: () => void
  children: React.ReactNode
}
interface State { err: Error | null; confirmWipe: boolean }

export class Guard extends React.Component<Props, State> {
  state: State = { err: null, confirmWipe: false }

  static getDerivedStateFromError(err: Error): Partial<State> { return { err } }

  componentDidCatch(err: Error) {
    sSet('view', 'm20')
    console.error('[OPERATOR] screen error:', err)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.err && prev.resetKey !== this.props.resetKey) this.setState({ err: null, confirmWipe: false })
  }

  home = () => {
    sSet('view', 'm20')
    if (this.props.onHome) { this.props.onHome(); this.setState({ err: null, confirmWipe: false }) }
    else window.location.reload()
  }

  backup = () => { void downloadFile(`operator-backup-${new Date().toISOString().slice(0, 10)}.json`, exportAll()) }

  render() {
    const { err } = this.state
    if (!err) return this.props.children
    const detail = `${String(err.message || err)}\n${String(err.stack ?? '').split('\n').slice(1, 3).join('\n')}`
    return (
      <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
        <section className="panel c12">
          <div className="head"><span className="lbl">This screen hit an error — your data is safe</span></div>
          <p className="small" style={{ margin: '4px 0 10px' }}>
            One screen failed while drawing. Nothing you entered was deleted, and every other screen still works.
            If this card appears again, screenshot it — the grey text below tells the engineer exactly where it broke.
          </p>
          <pre className="small mono" style={{
            whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: 'var(--panel2)',
            border: '1px solid var(--border)', borderRadius: 6, padding: 10, margin: '0 0 12px', opacity: 0.8,
          }}>{detail}</pre>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={this.home}>Open The Business</button>
            <button className="btn" onClick={() => window.location.reload()}>Reload the tool</button>
            <button className="btn" onClick={this.backup}>Download my data (backup)</button>
            {!this.state.confirmWipe
              ? <button className="btn danger" onClick={() => this.setState({ confirmWipe: true })}>Factory reset…</button>
              : <>
                  <span className="small">This deletes everything saved in this browser — download the backup first.</span>
                  <button className="btn danger" onClick={() => { wipeAll(); window.location.reload() }}>Yes, wipe and restart</button>
                  <button className="btn" onClick={() => this.setState({ confirmWipe: false })}>Cancel</button>
                </>}
          </div>
        </section>
      </div>
    )
  }
}
