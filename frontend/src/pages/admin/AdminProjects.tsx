import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';

interface AdminProject {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string | null;
  status: string;
  deadline: string | null;
  max_applicants: number;
  skills: { id: string; name: string }[];
  company: {
    id: string;
    user_id: string;
    company_name: string;
    industry: string | null;
    logo_url: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

interface PagedResponse {
  items: AdminProject[];
  total: number;
  page: number;
  size: number;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Відкритий', cls: 'bg-emerald-100 text-emerald-700' },
  in_progress: { label: 'В роботі', cls: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Завершений', cls: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Скасований', cls: 'bg-red-100 text-red-700' },
};

export default function AdminProjects() {
  const [data, setData] = useState<PagedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchProjects = async (p: number, s: string, st: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), size: '15' });
      if (s) params.set('search', s);
      if (st) params.set('status', st);
      const res = await api.get(`/admin/projects?${params}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(page, search, statusFilter);
  }, [page, search, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = data ? Math.ceil(data.total / data.size) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25">
            <FolderOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Проєкти</h1>
            <p className="text-slate-500 text-sm">
              {data ? `Всього: ${data.total}` : ''}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Пошук за назвою проєкту..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              Пошук
            </button>
          </form>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Всі статуси</option>
            <option value="open">Відкриті</option>
            <option value="in_progress">В роботі</option>
            <option value="completed">Завершені</option>
            <option value="cancelled">Скасовані</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Завантаження...</div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">Проєктів не знайдено</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Назва проєкту</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Компанія</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Статус</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Навички</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Дедлайн</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Макс. учасників</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Дата створення</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map(project => {
                    const statusMeta = STATUS_LABELS[project.status] ?? {
                      label: project.status,
                      cls: 'bg-slate-100 text-slate-600',
                    };
                    return (
                      <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 max-w-[200px] truncate" title={project.title}>
                            {project.title}
                          </div>
                          {project.description && (
                            <div className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate" title={project.description}>
                              {project.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {project.company ? (
                            <div className="flex items-center gap-1.5">
                              {project.company.logo_url ? (
                                <img src={project.company.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                                  {project.company.company_name[0]}
                                </div>
                              )}
                              <span className="text-slate-700 font-medium">{project.company.company_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {project.skills.slice(0, 2).map(s => (
                              <span key={s.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                                {s.name}
                              </span>
                            ))}
                            {project.skills.length > 2 && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">
                                +{project.skills.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString('uk-UA')
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-center">
                          {project.max_applicants}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(project.created_at).toLocaleDateString('uk-UA')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
