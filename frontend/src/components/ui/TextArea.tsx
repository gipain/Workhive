import { clsx } from 'clsx';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s/g, '_');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-xl text-sm transition-all duration-200 resize-y min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
          'placeholder:text-slate-400',
          error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
