export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-[3px] border-indigo-100 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">Завантаження...</p>
      </div>
    </div>
  );
}
