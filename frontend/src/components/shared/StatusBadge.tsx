import { statusLabels, statusColors } from '../../utils/helpers';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${colorClass}`}>
      {statusLabels[status] || status}
    </span>
  );
}
