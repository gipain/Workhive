import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '_');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-xl text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
          'placeholder:text-slate-400',
          error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white hover:border-slate-300',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
