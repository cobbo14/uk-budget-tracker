import { Component, type ReactNode } from 'react'
import { suppressPersistence } from '@/services/localStorage'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  private handleResetProfile = () => {
    if (!window.confirm('Reset the active profile’s data? This permanently deletes its saved data from this browser.')) return
    // Stop the beforeunload flush from writing the in-memory state back
    // over the key we're about to remove
    suppressPersistence()
    try {
      const raw = localStorage.getItem('uk_budget_tracker_profiles')
      const activeId = raw ? (JSON.parse(raw) as { activeProfileId?: string }).activeProfileId : undefined
      if (activeId) {
        localStorage.removeItem(`uk_budget_tracker_state_${activeId}`)
      } else {
        // No profile metadata to scope by — fall back to clearing everything
        this.clearAllKeys()
      }
    } catch {
      // Ignore storage errors
    }
    window.location.reload()
  }

  private handleResetAll = () => {
    if (!window.confirm('Reset ALL profiles? This permanently deletes every profile’s data from this browser.')) return
    suppressPersistence()
    this.clearAllKeys()
    window.location.reload()
  }

  private clearAllKeys() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('uk_budget_tracker'))
      for (const key of keys) localStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
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
              onClick={this.handleResetProfile}
            >
              Reset this profile
            </button>
            <button
              className="text-xs underline underline-offset-2 text-muted-foreground"
              onClick={this.handleResetAll}
            >
              Reset all profiles
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
