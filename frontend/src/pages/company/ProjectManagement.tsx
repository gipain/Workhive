import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Project, Application, Submission } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TextArea } from '../../components/ui/TextArea';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Skeleton';
import { SkillTag } from '../../components/shared/SkillTag';
import { EmptyState } from '../../components/shared/EmptyState';
import { ArrowLeft, Calendar, Users, CheckCircle, XCircle, Eye, GraduationCap, Star, Briefcase, ExternalLink, Flag, Award, Download } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { ComplaintModal } from '../../components/shared/ComplaintModal';

export default function ProjectManagement() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'applications' | 'submissions'>('applications');

  // Review submission modal
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [acting, setActing] = useState(false);

  // Complaint
  const [complaintTarget, setComplaintTarget] = useState<{ userId: string; name: string } | null>(null);

  // Certificates
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [projectCerts, setProjectCerts] = useState<Record<string, string>>({}); // student_id -> cert_id

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, appsRes, subsRes, certsRes] = await Promise.allSettled([
          api.get(`/api/projects/${id}`),
          api.get(`/api/applications/project/${id}`),
          api.get(`/api/submissions?project_id=${id}`),
          api.get(`/api/certificates/project/${id}`),
        ]);
        if (projRes.status === 'fulfilled') {
          setProject(projRes.value.data);
        } else {
          toast.error('Помилка завантаження проєкту');
        }
        if (appsRes.status === 'fulfilled') {
          const d = appsRes.value.data;
          setApplications(Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
        }
        if (subsRes.status === 'fulfilled') {
          const d = subsRes.value.data;
          setSubmissions(Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
        }
        if (certsRes.status === 'fulfilled') {
          const certMap: Record<string, string> = {};
          const items = certsRes.value.data.items ?? certsRes.value.data ?? [];
          for (const cert of items) {
            certMap[cert.student_id] = cert.id;
          }
          setProjectCerts(certMap);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownloadCert = async (certId: string, studentName: string) => {
    setDownloadingCert(certId);
    try {
      const response = await api.get(`/api/certificates/${certId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const safe = studentName.replace(/\s+/g, '_');
      link.setAttribute('download', `workhive_certificate_${safe}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Не вдалося завантажити сертифікат');
    } finally {
      setDownloadingCert(null);
    }
  };

  const handleApplication = async (appId: string, action: 'accept' | 'reject') => {
    setActing(true);
    try {
      await api.patch(`/api/applications/${appId}/${action}`);
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a));
      toast.success(action === 'accept' ? 'Заявку прийнято' : 'Заявку відхилено');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const handleReviewSubmission = async (status: 'approved' | 'changes_requested') => {
    if (!selectedSubmission) return;
    setActing(true);
    try {
      await api.patch(`/api/submissions/${selectedSubmission.id}/review`, {
        status,
        feedback: feedback || undefined,
      });
      setSubmissions((prev) => prev.map((s) => s.id === selectedSubmission.id ? { ...s, status } : s));
      setReviewModal(false);
      toast.success(status === 'approved' ? 'Роботу прийнято' : 'Запитано зміни');

      // If approved, create review
      if (status === 'approved') {
        try {
          await api.post('/api/reviews', {
            project_id: id,
            student_id: selectedSubmission.student_id,
            rating,
            comment: feedback || 'Гарна робота!',
          });
          toast.success('Відгук створено, сертифікат генерується');
          // Refresh certs after backend background task completes
          setTimeout(async () => {
            try {
              const certsRes = await api.get(`/api/certificates/project/${id}`);
              const certMap: Record<string, string> = {};
              const items = certsRes.data.items ?? certsRes.data ?? [];
              for (const cert of items) certMap[cert.student_id] = cert.id;
              setProjectCerts(certMap);
            } catch { /* silent */ }
          }, 3000);
        } catch {
          // review may already exist
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!project) return <p>Проєкт не знайдено</p>;

  return (
    <div className="space-y-8">
      <Link to="/company/projects" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Назад
      </Link>

      {/* Project header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{project.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> до {formatDate(project.deadline)}</span>
            <span className="flex items-center gap-1.5"><Users size={14} /> макс. {project.max_applicants}</span>
          </div>
        </div>
        <Badge
          variant={
            project.status === 'open' ? 'success' :
            project.status === 'completed' ? 'default' :
            project.status === 'cancelled' ? 'danger' : 'warning'
          }
          className="text-sm"
        >
          {project.status === 'open' ? 'Відкритий' :
           project.status === 'in_progress' ? 'В роботі' :
           project.status === 'completed' ? 'Завершено' :
           project.status === 'cancelled' ? 'Скасовано' : project.status}
        </Badge>
      </div>

      {project.skills && project.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.skills.map((s) => <SkillTag key={s.id} name={s.name} />)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(['applications', 'submissions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
              tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'applications' ? `Заявки (${applications.length})` : `Здачі (${submissions.length})`}
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {tab === 'applications' && (
        applications.length === 0 ? (
          <EmptyState title="Заявок поки немає" description="Студенти зможуть подавати заявки на ваш проєкт" />
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <Card key={a.id}>
                <CardContent className="py-4 gap-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      {/* Name + date */}
                      <p className="font-semibold text-slate-900">{a.student?.first_name} {a.student?.last_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.student?.email} · {formatDate(a.created_at)}</p>

                      {/* University + graduation */}
                      {(a.student?.university || a.student?.graduation_year) && (
                        <p className="text-sm text-slate-600 mt-1.5 flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-slate-400 shrink-0" />
                          {a.student.university}{a.student.university && a.student.graduation_year ? ', ' : ''}{a.student.graduation_year && `випуск ${a.student.graduation_year}`}
                        </p>
                      )}

                      {/* Stats */}
                      {((a.student?.rating_avg ?? 0) > 0 || (a.student?.total_completed ?? 0) > 0) && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          {(a.student?.rating_avg ?? 0) > 0 && (
                            <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {a.student!.rating_avg.toFixed(1)}</span>
                          )}
                          {(a.student?.total_completed ?? 0) > 0 && (
                            <span className="flex items-center gap-1"><Briefcase size={11} /> {a.student!.total_completed} завершених</span>
                          )}
                        </div>
                      )}

                      {/* Skills */}
                      {a.student?.skills && a.student.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {a.student.skills.map((s) => <SkillTag key={s.id} name={s.name} />)}
                        </div>
                      )}

                      {/* Bio */}
                      {a.student?.bio && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{a.student.bio}</p>
                      )}

                      {/* Cover letter */}
                      {a.cover_letter && (
                        <p className="text-sm text-slate-600 mt-2 border-l-2 border-indigo-200 pl-2">{a.cover_letter}</p>
                      )}

                      {/* Links */}
                      {(a.student?.portfolio_url || a.student?.resume_url) && (
                        <div className="flex gap-3 mt-2">
                          {a.student.portfolio_url && (
                            <a href={a.student.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                              <ExternalLink size={11} /> Портфоліо
                            </a>
                          )}
                          {a.student.resume_url && (
                            <a href={a.student.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                              <ExternalLink size={11} /> Резюме
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {a.status === 'pending' ? (
                        <>
                          <Button size="sm" onClick={() => handleApplication(a.id, 'accept')} isLoading={acting}>
                            <CheckCircle size={14} /> Прийняти
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleApplication(a.id, 'reject')} isLoading={acting}>
                            <XCircle size={14} /> Відхилити
                          </Button>
                        </>
                      ) : (
                        <Badge variant={a.status === 'accepted' ? 'success' : 'danger'}>
                          {a.status === 'accepted' ? 'Прийнято' : 'Відхилено'}
                        </Badge>
                      )}
                      {a.student?.user_id && (
                        <button
                          onClick={() => setComplaintTarget({ userId: a.student!.user_id, name: `${a.student!.first_name} ${a.student!.last_name}` })}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Поскаржитись"
                        >
                          <Flag size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Submissions tab */}
      {tab === 'submissions' && (
        submissions.length === 0 ? (
          <EmptyState title="Здач поки немає" description="Прийняті студенти зможуть здавати результати роботи" />
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between py-4 gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{s.student?.first_name} {s.student?.last_name}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(s.created_at)}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{s.content}</p>
                    {s.file_url && (
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 text-xs font-medium mt-1 inline-block transition-colors">
                        Переглянути файл
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.status === 'pending_review' ? (
                      <Button size="sm" onClick={() => { setSelectedSubmission(s); setFeedback(''); setRating(5); setReviewModal(true); }}>
                        <Eye size={14} /> Рецензувати
                      </Button>
                    ) : (
                      <>
                        <Badge variant={s.status === 'approved' ? 'success' : 'warning'}>
                          {s.status === 'approved' ? 'Прийнято' : 'Потребує змін'}
                        </Badge>
                        {s.status === 'approved' && projectCerts[s.student_id] && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={downloadingCert === projectCerts[s.student_id]}
                            onClick={() => handleDownloadCert(
                              projectCerts[s.student_id],
                              `${s.student?.first_name ?? ''}_${s.student?.last_name ?? ''}`,
                            )}
                          >
                            <Award size={13} />
                            <Download size={13} />
                            Сертифікат
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Review modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Рецензування роботи">
        <div className="space-y-4">
          <TextArea
            label="Коментар"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Ваш відгук щодо роботи..."
            rows={3}
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Оцінка (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  className={`w-10 h-10 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    rating >= v ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-500 shadow-md shadow-indigo-500/25' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleReviewSubmission('changes_requested')} isLoading={acting}>
              Запросити зміни
            </Button>
            <Button onClick={() => handleReviewSubmission('approved')} isLoading={acting}>
              Прийняти роботу
            </Button>
          </div>
        </div>
      </Modal>

      {complaintTarget && (
        <ComplaintModal
          isOpen={!!complaintTarget}
          onClose={() => setComplaintTarget(null)}
          targetUserId={complaintTarget.userId}
          targetName={complaintTarget.name}
        />
      )}
    </div>
  );
}
