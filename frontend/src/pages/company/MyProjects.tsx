import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Project } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { Plus, Calendar, Globe, Trash2, XCircle, FileEdit, Pencil } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { getApiErrorMessage } from '../../utils/apiError';
import toast from 'react-hot-toast';

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchProjects = useCallback(async (statusFilter: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { size: '100' };
      if (statusFilter) params.status = statusFilter;
      const r = await api.get('/api/projects/my', { params });
      setProjects(Array.isArray(r.data?.items) ? r.data.items : []);
    } catch {
      toast.error('Не вдалося завантажити проєкти');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(filter);
  }, [filter, fetchProjects]);

  const handlePublish = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActing(id);
    try {
      await api.patch(`/api/projects/${id}/publish`);
      toast.success('Проєкт опубліковано');
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, is_draft: false } : p));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Скасувати проєкт? Цю дію не можна відмінити.')) return;
    setActing(id);
    try {
      await api.patch(`/api/projects/${id}/cancel`);
      toast.success('Проєкт скасовано');
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status: 'cancelled' } : p));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Видалити «${title}»? Цю дію не можна відмінити.`)) return;
    setActing(id);
    try {
      await api.delete(`/api/projects/${id}`);
      toast.success('Проєкт видалено');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  if (loading) return <PageLoader />;

  const STATUS_LABELS: Record<string, string> = {
    open: 'Відкритий',
    in_progress: 'В роботі',
    completed: 'Завершено',
    cancelled: 'Скасовано',
  };
  const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
    open: 'success',
    in_progress: 'warning',
    completed: 'info',
    cancelled: 'default',
  };

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
        <EmptyState
          title="Проєктів немає"
          description="Створіть перший проєкт"
          actionLabel="Створити проєкт"
          actionHref="/company/projects/new"
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/company/projects/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4 gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{p.title}</p>
                      {p.is_draft && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <FileEdit size={10} />
                          Чернетка
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} />
                      до {formatDate(p.deadline)} · макс. {p.max_applicants} студентів
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
                    {/* Edit button for drafts and open projects */}
                    {(p.is_draft || p.status === 'open' || p.status === 'in_progress') && (
                      <Link to={`/company/projects/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline">
                          <Pencil size={13} /> Редагувати
                        </Button>
                      </Link>
                    )}

                    {/* Publish button for drafts */}
                    {p.is_draft && (
                      <Button
                        size="sm"
                        isLoading={acting === p.id}
                        onClick={(e) => handlePublish(e, p.id)}
                      >
                        <Globe size={13} />
                        Опублікувати
                      </Button>
                    )}

                    {/* Cancel button for open/in_progress */}
                    {!p.is_draft && (p.status === 'open' || p.status === 'in_progress') && (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={acting === p.id}
                        onClick={(e) => handleCancel(e, p.id)}
                      >
                        <XCircle size={13} />
                        Скасувати
                      </Button>
                    )}

                    {/* Delete button for drafts and cancelled */}
                    {(p.is_draft || p.status === 'cancelled') && (
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={acting === p.id}
                        onClick={(e) => handleDelete(e, p.id, p.title)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}

                    {!p.is_draft && (
                      <Badge variant={STATUS_VARIANTS[p.status] ?? 'default'}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
