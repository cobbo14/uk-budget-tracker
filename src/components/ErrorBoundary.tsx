import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  private handleReset = () => {
    try {
      // Clear all app data from localStorage to recover from corrupt state
      const keys = Object.keys(localStorage).filter(k => k.startsWith('uk_budget_tracker'))
      for (const key of keys) localStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-3">
          <p className="font-medium text-destructive">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{this.state.message}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              className="text-sm underline underline-offset-2"
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              Try again
            </button>
            <button
              className="text-sm underline underline-offset-2 text-destructive"
              onClick={this.handleReset}
            >
              Reset all data
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
