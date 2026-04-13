export function Footer() {
  return (
    <footer className="bg-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-0.5">
            <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Work
            </span>
            <span className="text-lg font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Hive
            </span>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} WorkHive. Практика для кожного — досвід для майбутнього.
          </p>
        </div>
      </div>
    </footer>
  );
}
