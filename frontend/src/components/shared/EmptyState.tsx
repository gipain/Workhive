import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, action, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      {icon && <div className="mb-5 text-slate-300 p-4 bg-slate-50 rounded-2xl">{icon}</div>}
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 max-w-md leading-relaxed">{description}</p>}
      {action}
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <Button variant="outline" size="sm">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
