import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Application, Submission, Certificate } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextArea } from '../../components/ui/TextArea';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkillTag } from '../../components/shared/SkillTag';
import {
  Calendar, Upload, Award, Download, Star, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface ProjectEntry {
  application: Application;
  submissions: Submission[];
  certificate: Certificate | null;
}

const statusLabel: Record<string, string> = {
  open: 'Відкритий',
  in_progress: 'В роботі',
  completed: 'Завершено',
  cancelled: 'Скасовано',
};

const subStatusLabel: Record<string, string> = {
  pending_review: 'На рецензуванні',
  changes_requested: 'Потребує змін',
  approved: 'Прийнято ✓',
};

export default function MyProjects() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Submit work modal
  const [submitModal, setSubmitModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const appRes = await api.get('/api/applications/my');
        const apps: Application[] = appRes.data.items || appRes.data;
        const accepted = apps.filter((a) => a.status === 'accepted');

        const results: ProjectEntry[] = await Promise.all(
          accepted.map(async (app) => {
            const subsRes = await api.get(`/api/submissions?project_id=${app.project_id}`).catch(() => ({ data: [] }));
            const subs: Submission[] = subsRes.data.items || subsRes.data;
            return { application: app, submissions: subs, certificate: null };
          })
        );

        // Load certificates and map by project_id
        try {
          const certRes = await api.get(`/api/certificates/student/${user.id}`);
          const allCerts: Certificate[] = certRes.data.items || certRes.data;
          results.forEach((entry) => {
            entry.certificate = allCerts.find((c) => c.project_id === entry.application.project_id) || null;
          });
        } catch {/* no certs yet */}

        setEntries(results);
      } catch {
        toast.error('Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const openSubmit = (projectId: string) => {
    setActiveProjectId(projectId);
    setContent('');
    setFileUrl('');
    setSubmitModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/submissions', {
        project_id: activeProjectId,
        content,
        file_url: fileUrl || undefined,
      });
      setEntries((prev) =>
        prev.map((entry) =>
          entry.application.project_id === activeProjectId
            ? { ...entry, submissions: [res.data, ...entry.submissions] }
            : entry
        )
      );
      setSubmitModal(false);
      toast.success('Роботу здано! Очікуйте перевірки від компанії.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Мої проєкти</h1>
        <p className="text-slate-500 mt-1">Проєкти, де вас прийняли</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="Немає активних проєктів"
          description="Подайте заявку на проєкт і дочекайтесь підтвердження"
          actionLabel="Переглянути проєкти"
          actionHref="/student/projects"
        />
      ) : (
        <div className="space-y-5">
          {entries.map(({ application: a, submissions, certificate }) => {
            const project = a.project;
            const isExpanded = expanded[a.id];
            const latestSub = submissions[0];
            const hasApproved = submissions.some((s) => s.status === 'approved');
            const canSubmit = project?.status !== 'completed' && project?.status !== 'cancelled';

            return (
              <Card key={a.id}>
                {/* ── Header row - always visible ─────────────────────── */}
                <div className="flex items-stretch gap-0">
                  {/* Left color strip */}
                  <div className={`w-1 rounded-l-2xl flex-shrink-0 ${
                    project?.status === 'completed' ? 'bg-emerald-400' :
                    project?.status === 'in_progress' ? 'bg-amber-400' : 'bg-indigo-400'
                  }`} />

                  {/* Main header content */}
                  <div
                    className="flex-1 flex items-center justify-between gap-3 px-5 py-4 cursor-pointer min-w-0"
                    onClick={() => toggleExpand(a.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-slate-900">{project?.title || 'Проєкт'}</h2>
                        <Badge variant={
                          project?.status === 'completed' ? 'success' :
                          project?.status === 'in_progress' ? 'warning' : 'default'
                        }>
                          {statusLabel[project?.status || ''] || project?.status}
                        </Badge>
                        {certificate && (
                          <Badge variant="success" className="gap-1">
                            <Award size={10} /> Сертифікат
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                        {project?.company?.company_name && <span>{project.company.company_name}</span>}
                        {project?.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> до {formatDate(project.deadline)}
                          </span>
                        )}
                        {latestSub && (
                          <span className={
                            latestSub.status === 'approved' ? 'text-emerald-500 font-medium' :
                            latestSub.status === 'changes_requested' ? 'text-amber-500 font-medium' :
                            'text-slate-400'
                          }>
                            · {subStatusLabel[latestSub.status]}
                          </span>
                        )}
                      </div>
                      {project?.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.skills.map((s) => <SkillTag key={s.id} name={s.name} />)}
                        </div>
                      )}
                    </div>

                    {/* Right: submit button + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canSubmit && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" onClick={() => openSubmit(a.project_id)}>
                            <Upload size={12} /> Здати
                          </Button>
                        </div>
                      )}
                      {isExpanded
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                      }
                    </div>
                  </div>
                </div>

                {/* ── Expanded content ──────────────────────────────────── */}
                {isExpanded && (
                  <CardContent className="border-t border-slate-100 space-y-4">
                    {/* Project description */}
                    {project?.description && (
                      <p className="text-sm text-slate-600">{project.description}</p>
                    )}

                    {/* Certificate */}
                    {certificate && (
                      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/60 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
                            <Award size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Сертифікат отримано!</p>
                            <p className="text-xs text-slate-500">Видано {formatDate(certificate.issued_at)}</p>
                          </div>
                        </div>
                        <a href={`/api/certificates/${certificate.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <Download size={14} /> PDF
                          </Button>
                        </a>
                      </div>
                    )}

                    {/* Waiting for review block */}
                    {hasApproved && !certificate && (
                      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-sm text-amber-800">
                        <div className="flex items-center gap-2 font-semibold mb-1">
                          <Star size={14} className="text-amber-500" /> Чекаємо відгук від компанії
                        </div>
                        Після того як компанія залишить відгук, ви отримаєте сертифікат і рейтинг оновиться.
                      </div>
                    )}

                    {/* Submissions history */}
                    {submissions.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Здачі ({submissions.length})</h3>
                        {submissions.map((s) => (
                          <div key={s.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-slate-400">{formatDateTime(s.created_at)}</p>
                              <Badge variant={
                                s.status === 'approved' ? 'success' :
                                s.status === 'changes_requested' ? 'warning' : 'default'
                              }>
                                {subStatusLabel[s.status]}
                              </Badge>
                            </div>
                            {(s.content || s.comment) && (
                              <p className="text-sm text-slate-700">{s.content || s.comment}</p>
                            )}
                            {s.file_url && (
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                                <ExternalLink size={11} /> Переглянути файл
                              </a>
                            )}
                            {s.reviewer_comment && (
                              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                                <p className="text-xs text-slate-500 font-semibold mb-1">Коментар компанії:</p>
                                <p className="text-slate-700">{s.reviewer_comment}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No submissions yet */}
                    {submissions.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Ще немає здач — натисніть «Здати», щоб надіслати роботу.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit work modal */}
      <Modal isOpen={submitModal} onClose={() => setSubmitModal(false)} title="Здати роботу">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextArea
            label="Опис виконаної роботи"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Опишіть що зробили, посилання на репозиторій, результати..."
            rows={5}
            required
          />
          <Input
            label="Посилання на файл / репозиторій (необов'язково)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSubmitModal(false)}>Скасувати</Button>
            <Button type="submit" isLoading={submitting}>
              <Upload size={14} /> Надіслати
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
