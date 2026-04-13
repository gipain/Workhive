import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { User } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PageLoader } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { Search, ShieldCheck, ShieldX } from 'lucide-react';
import { useDebounce } from '../../hooks/useApi';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || '';
  const limit = 20;
  const debouncedSearch = useDebounce(search, 400);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/api/admin/users', { params });
      setUsers(res.data.items || res.data);
      setTotal(res.data.total || (res.data.items || res.data).length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value);
    else sp.delete(key);
    if (key !== 'page') sp.set('page', '1');
    setSearchParams(sp);
  };

  const toggleActive = async (userId: string) => {
    setToggling(userId);
    try {
      await api.patch(`/api/admin/users/${userId}/toggle-active`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !u.is_active } : u));
      toast.success('Статус змінено');
    } catch {
      toast.error('Помилка');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Користувачі</h1>
        <p className="text-slate-500 mt-1">Управління користувачами платформи</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук за email або ім'ям..."
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none hover:border-slate-300 transition-all duration-200"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setParam('role', e.target.value)}
          options={[
            { value: '', label: 'Усі ролі' },
            { value: 'student', label: 'Студенти' },
            { value: 'company', label: 'Компанії' },
            { value: 'admin', label: 'Адміни' },
          ]}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <EmptyState title="Користувачів не знайдено" />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Ім'я</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Роль</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Статус</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.student_profile ? `${u.student_profile.first_name} ${u.student_profile.last_name}` : u.company_profile?.company_name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'info' : u.role === 'company' ? 'warning' : 'default'}>
                        {u.role === 'student' ? 'Студент' : u.role === 'company' ? 'Компанія' : 'Адмін'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Активний' : 'Заблок.'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.is_active ? 'outline' : 'primary'}
                        onClick={() => toggleActive(u.id)}
                        isLoading={toggling === u.id}
                      >
                        {u.is_active ? <><ShieldX size={14} /> Заблокувати</> : <><ShieldCheck size={14} /> Розблокувати</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={(p) => setParam('page', String(p))} />
        </>
      )}
    </div>
  );
}
