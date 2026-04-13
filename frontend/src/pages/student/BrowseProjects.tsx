import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Project, Skill } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkillTag } from '../../components/shared/SkillTag';
import { Search, Calendar, Building2 } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { useDebounce } from '../../hooks/useApi';

export default function BrowseProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const skillFilter = searchParams.get('skill') || '';
  const status = searchParams.get('status') || 'open';
  const limit = 12;

  const debouncedSearch = useDebounce(search, 400);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: limit, status };
      if (debouncedSearch) params.search = debouncedSearch;
      if (skillFilter) params.skill = skillFilter;
      const res = await api.get('/api/projects', { params });
      setProjects(res.data.items || res.data);
      setTotal(res.data.total || (res.data.items || res.data).length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, skillFilter, status]);

  useEffect(() => {
    api.get('/api/skills').then((r) => setSkills(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value);
    else sp.delete(key);
    if (key !== 'page') sp.set('page', '1');
    setSearchParams(sp);
  };

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-black text-slate-900">Знайти проєкт</h1>
        <p className="text-slate-500 mt-1">Відкрийте для себе цікаві можливості</p>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 gap-4 animate-fade-in-up delay-100">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук проєктів..."
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all duration-200 hover:border-slate-300 placeholder:text-slate-400"
          />
        </div>
        <Select
          value={skillFilter}
          onChange={(e) => setParam('skill', e.target.value)}
          options={[{ value: '', label: 'Усі навички' }, ...skills.map((s) => ({ value: s.name, label: s.name }))]}
        />
        <Select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          options={[
            { value: 'open', label: 'Відкриті' },
            { value: 'in_progress', label: 'В роботі' },
            { value: '', label: 'Усі' },
          ]}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : projects.length === 0 ? (
        <EmptyState title="Проєктів не знайдено" description="Спробуйте змінити фільтри" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Link key={p.id} to={`/student/projects/${p.id}`}>
                <Card hover className="h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 line-clamp-2">{p.title}</h3>
                      <Badge variant={p.status === 'open' ? 'success' : 'default'} className="flex-shrink-0">
                        {p.status === 'open' ? 'Відкритий' : p.status}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{p.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.skills || []).slice(0, 4).map((s) => (
                        <SkillTag key={s.id} name={s.name} />
                      ))}
                      {(p.skills || []).length > 4 && (
                        <span className="text-xs text-slate-400 self-center">+{p.skills!.length - 4}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> {p.company?.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> до {formatDate(p.deadline)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={(p) => setParam('page', String(p))} />
        </>
      )}
    </div>
  );
}
