import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Невідома помилка' };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleBack = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-rose-50/10 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-6">
              <AlertTriangle size={28} className="text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Щось пішло не так</h1>
            <p className="text-slate-500 mb-2">
              Виникла помилка при відображенні сторінки.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-2 font-mono mb-6 break-all">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md shadow-indigo-500/25"
              >
                <RefreshCw size={15} />
                Перезавантажити
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
