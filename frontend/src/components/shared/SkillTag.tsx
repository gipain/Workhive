import { X } from 'lucide-react';

interface SkillTagProps {
  name: string;
  onRemove?: () => void;
}

export function SkillTag({ name, onRemove }: SkillTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-sm">
      {name}
      {onRemove && (
        <button onClick={onRemove} className="p-0.5 rounded hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
          <X size={12} />
        </button>
      )}
    </span>
  );
}
