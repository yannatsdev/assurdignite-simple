import React from 'react';

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Best-effort logging; swallow failures so the boundary never throws.
    try {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info.componentStack);
    } catch {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (typeof window !== 'undefined') window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-dvh flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Une erreur est survenue</h1>
          <p className="text-muted-foreground text-sm">
            Nous avons rencontré un problème inattendu. Réessayez ou revenez à l'accueil.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center justify-center min-h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Revenir à l'accueil
          </button>
        </div>
      </div>
    );
  }
}
