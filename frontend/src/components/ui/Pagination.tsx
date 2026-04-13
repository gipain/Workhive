import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page?: number;
  total?: number;
  size?: number;
  onChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Pagination(props: PaginationProps) {
  const page = props.currentPage ?? props.page ?? 1;
  const totalPages = props.totalPages ?? (props.total && props.size ? Math.ceil(props.total / props.size) : 1);
  const onChange = props.onPageChange ?? props.onChange ?? (() => {});
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-gray-600">
        {page} / {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
