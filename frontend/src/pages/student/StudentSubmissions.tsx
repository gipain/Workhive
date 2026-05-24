import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import type { Project, Submission } from '../../types';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { ArrowLeft, Upload } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';
import { Link } from 'react-router-dom';

export default function StudentSubmissions() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, subsRes] = await Promise.all([
          api.get(`/api/projects/${projectId}`),
          api.get(`/api/submissions?project_id=${projectId}`),
        ]);
        setProject(projRes.data);
        setSubmissions(subsRes.data.items || subsRes.data);
      } catch {
        toast.error('Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/submissions', {
        project_id: projectId,
        content,
        file_url: fileUrl || undefined,
      });
      setSubmissions([res.data, ...submissions]);
      setContent('');
      setFileUrl('');
      toast.success('Роботу здано');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/student/applications" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Назад
      </Link>

      <h1 className="text-2xl font-black text-slate-900">Здача роботи: {project?.title}</h1>

      {/* Submit form */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Нова здача</h2></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextArea
              label="Опис роботи"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Опишіть виконану роботу, посилання на репозиторій..."
              rows={4}
              required
            />
            <Input
              label="Посилання на файл/репозиторій (необов'язково)"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://github.com/..."
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={submitting}>
                <Upload size={14} /> Здати роботу
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Previous submissions */}
      <h2 className="text-lg font-bold text-slate-900">Історія здач</h2>
      {submissions.length === 0 ? (
        <EmptyState title="Здач ще немає" description="Здайте першу роботу" />
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{formatDateTime(s.created_at)}</p>
                  <Badge variant={s.status === 'approved' ? 'success' : s.status === 'changes_requested' ? 'warning' : 'default'}>
                    {s.status === 'approved' ? 'Прийнято' : s.status === 'changes_requested' ? 'Потребує змін' : 'На рецензуванні'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700">{s.comment}</p>
                {s.file_url && (
                  <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 text-xs font-medium transition-colors">
                    Переглянути файл
                  </a>
                )}
                {s.reviewer_comment && (
                  <div className="bg-slate-50 rounded-xl p-3 text-sm">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Коментар компанії:</p>
                    <p className="text-slate-700">{s.reviewer_comment}</p>
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
