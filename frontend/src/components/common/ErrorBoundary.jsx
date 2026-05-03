import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    // In production you'd send to a logging service like Sentry here
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                An unexpected error occurred. This has been noted and will be looked into.
                Please try refreshing the page.
              </p>
            </div>

            {/* Dev-only error detail */}
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-dark-800 border border-dark-600 rounded-xl p-4 overflow-auto max-h-48">
                <p className="text-red-400 text-xs font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-slate-500 text-xs mt-2 overflow-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={this.handleRetry}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = '/login'; }}
                className="btn-secondary"
              >
                Back to Login
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              If this keeps happening, contact your society admin.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
