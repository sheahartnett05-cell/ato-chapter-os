import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Catch render errors so corrupt data does not white-screen the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[agora] uncaught render error', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
    window.location.assign('/preview')
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface,#f8f9fb)] px-6 text-center">
          <h1 className="font-serif text-2xl text-[var(--ink,#141414)]">Something went wrong</h1>
          <p className="max-w-md text-sm text-[var(--muted,#6b6b6b)]">
            The app hit an unexpected error. Your chapter data is still in the browser — try
            clearing the broken entry in devtools or start fresh from preview.
          </p>
          <p className="max-w-md font-mono text-[10px] text-red-700/80">{this.state.error.message}</p>
          <button type="button" onClick={this.reset} className="btn-primary">
            Go to preview
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
