import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Project } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { Plus, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function MyProjects() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = { company_id: user?.id || '', size: '100' };
    if (filter) params.status = filter;
    api.get('/api/projects', { params })
      .then((r) => setProjects(r.data.items || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, filter]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Мої проєкти</h1>
        <div className="flex items-center gap-3">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: '', label: 'Усі статуси' },
              { value: 'open', label: 'Відкриті' },
              { value: 'in_progress', label: 'В роботі' },
              { value: 'completed', label: 'Завершені' },
              { value: 'cancelled', label: 'Скасовані' },
            ]}
          />
          <Link to="/company/projects/new">
            <Button><Plus size={16} /> Новий</Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="Проєктів немає" description="Створіть перший проєкт" actionLabel="Створити проєкт" actionHref="/company/projects/new" />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/company/projects/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> до {formatDate(p.deadline)} · макс. {p.max_applicants} студентів
                    </p>
                  </div>
                  <Badge variant={p.status === 'open' ? 'success' : p.status === 'in_progress' ? 'warning' : p.status === 'completed' ? 'info' : 'default'}>
                    {p.status === 'open' ? 'Відкритий' : p.status === 'in_progress' ? 'В роботі' : p.status === 'completed' ? 'Завершено' : 'Скасовано'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
