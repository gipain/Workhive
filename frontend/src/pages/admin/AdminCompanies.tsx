import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

interface AdminCompany {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  created_at: string;
  email: string;
  is_active: boolean;
  hashed_password: string;
}

interface PagedResponse {
  items: AdminCompany[];
  total: number;
  page: number;
  size: number;
}

export default function AdminCompanies() {
  const [data, setData] = useState<PagedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const fetchCompanies = async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), size: '15' });
      if (s) params.set('search', s);
      const res = await api.get(`/admin/companies?${params}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(page, search);
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalPages = data ? Math.ceil(data.total / data.size) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-500/25">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Компанії</h1>
            <p className="text-slate-500 text-sm">
              {data ? `Всього: ${data.total}` : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Пошук за назвою або email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-600 transition-all"
          >
            Пошук
          </button>
        </form>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Завантаження...</div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">Компаній не знайдено</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Назва компанії</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Пароль (хеш)</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Галузь</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Вебсайт</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map(company => (
                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                              {company.company_name[0]}
                            </div>
                          )}
                          {company.company_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{company.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-slate-100 rounded px-2 py-1 font-mono max-w-[160px] truncate block">
                            {visiblePasswords.has(company.id)
                              ? company.hashed_password
                              : '••••••••••••••••••••'}
                          </code>
                          <button
                            onClick={() => togglePassword(company.id)}
                            className="text-slate-400 hover:text-slate-700 shrink-0"
                          >
                            {visiblePasswords.has(company.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {company.industry || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 hover:underline text-xs truncate max-w-[120px] block"
                          >
                            {company.website}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          company.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {company.is_active ? 'Активна' : 'Заблокована'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
