import React from "react";

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("UI crashed:", error, info); }
  reset = () => this.setState({ error: null });
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center space-y-4 bg-card border border-blood-red/40 rounded-lg p-6">
          <h2 className="font-display text-blood-red text-lg">⚠ Something broke</h2>
          <p className="text-xs text-muted-foreground break-words">{this.state.error.message}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={this.reset} className="px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-display">Retry</button>
            <button onClick={() => location.assign("/")} className="px-4 py-2 rounded border border-border text-xs font-display">Home</button>
          </div>
        </div>
      </div>
    );
  }
}
