import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 mx-auto max-w-lg rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
            {this.props.fallbackTitle || 'Хатогӣ рух дод / Произошла ошибка'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {this.state.error?.message || 'Unexpected application error.'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Аз нав бор кардан / Обновить</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
