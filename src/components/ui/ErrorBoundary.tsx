import { Component, type ErrorInfo, type ReactNode } from 'react'
import { wipeLocalAndLeaveCloudChapters } from '../../lib/chapterCloud'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  wiping: boolean
}

/** Catch render errors so corrupt data does not white-screen the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, wiping: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[agora] uncaught render error', error, info.componentStack)
  }

  private goPreview = () => {
    this.setState({ error: null })
    window.location.assign('/preview')
  }

  private wipeAndRestart = async () => {
    this.setState({ wiping: true })
    try {
      await wipeLocalAndLeaveCloudChapters()
    } finally {
      window.location.assign('/onboarding')
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface,#f8f9fb)] px-6 text-center">
          <h1 className="font-serif text-2xl text-[var(--ink,#141414)]">Something went wrong</h1>
          <p className="max-w-md text-sm text-[var(--muted,#6b6b6b)]">
            Corrupt local chapter data or a stale cloud membership can break the app. Wipe test
            data and start onboarding again, or open guest preview.
          </p>
          <p className="max-w-md font-mono text-[10px] text-red-700/80">{this.state.error.message}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={this.state.wiping}
              onClick={() => void this.wipeAndRestart()}
              className="btn-primary"
            >
              {this.state.wiping ? 'Wiping…' : 'Wipe chapter & restart'}
            </button>
            <button type="button" onClick={this.goPreview} className="btn-ghost">
              Go to preview
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
