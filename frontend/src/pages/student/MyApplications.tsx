import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Application } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatDate } from '../../utils/helpers';

const statusMap: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
  pending: { label: 'Очікує', variant: 'warning' },
  accepted: { label: 'Прийнято', variant: 'success' },
  rejected: { label: 'Відхилено', variant: 'danger' },
  withdrawn: { label: 'Відкликано', variant: 'default' },
};

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/applications/my')
      .then((r) => setApplications(r.data.items || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-black text-slate-900">Мої заявки</h1>
        <p className="text-slate-500 mt-1">Відстежуйте статус ваших заявок</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="Заявок немає" description="Знайдіть проєкт і подайте заявку" actionLabel="Переглянути проєкти" actionHref="/student/projects" />
      ) : (
        <div className="space-y-3">
          {applications.map((a) => {
            const st = statusMap[a.status] || statusMap.pending;
            return (
              <Link key={a.id} to={`/student/projects/${a.project_id}`}>
                <Card hover>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{a.project?.title || 'Проєкт'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Подано {formatDate(a.created_at)}</p>
                      {a.cover_letter && (
                        <p className="text-xs text-slate-400 truncate mt-1">{a.cover_letter}</p>
                      )}
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
