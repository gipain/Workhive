import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Complaint } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    api.get('/api/admin/complaints', { params })
      .then((r) => setComplaints(r.data.items || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    setActing(id);
    try {
      await api.patch(`/api/admin/complaints/${id}`, { status });
      setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      toast.success(status === 'resolved' ? 'Скаргу розглянуто' : 'Скаргу відхилено');
    } catch {
      toast.error('Помилка');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Скарги</h1>
          <p className="text-sm text-slate-500 mt-0.5">Перегляд та розгляд скарг користувачів</p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={[
            { value: 'open', label: 'На розгляді' },
            { value: 'resolved', label: 'Розглянуті' },
            { value: 'dismissed', label: 'Відхилені' },
            { value: '', label: 'Усі' },
          ]}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : complaints.length === 0 ? (
        <EmptyState title="Скарг немає" description="Чудово, нічого на розгляді" />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">Скарга #{c.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">
                      Від {c.reporter?.email || 'Користувач'} · {formatDateTime(c.created_at)}
                    </p>
                  </div>
                  <Badge variant={c.status === 'open' ? 'warning' : c.status === 'resolved' ? 'success' : 'default'}>
                    {c.status === 'open' ? 'На розгляді' : c.status === 'resolved' ? 'Розглянуто' : 'Відхилено'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700">{c.reason}</p>
                {c.target_user && (
                  <p className="text-xs text-slate-500">Скарга на: {c.target_user.email}</p>
                )}
                {c.status === 'open' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => handleResolve(c.id, 'resolved')} isLoading={acting === c.id}>
                      Розглянути
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolve(c.id, 'dismissed')} isLoading={acting === c.id}>
                      Відхилити
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
