import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-indigo-50 text-indigo-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-600',
    purple: 'bg-violet-50 text-violet-700',
    blue: 'bg-sky-50 text-sky-700',
    orange: 'bg-orange-50 text-orange-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
