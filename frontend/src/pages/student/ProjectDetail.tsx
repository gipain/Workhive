import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Project } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextArea } from '../../components/ui/TextArea';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Skeleton';
import { SkillTag } from '../../components/shared/SkillTag';
import { Calendar, Building2, Users, ArrowLeft, Flag } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';
import { ComplaintModal } from '../../components/shared/ComplaintModal';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, appsRes] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get('/api/applications/my'),
        ]);
        setProject(projRes.data);
        const myApps = appsRes.data.items || appsRes.data;
        setAlreadyApplied(myApps.some((a: { project_id: string }) => a.project_id === id));
      } catch {
        toast.error('Не вдалося завантажити проєкт');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post('/api/applications', { project_id: id, cover_letter: coverLetter || undefined });
      toast.success('Заявку надіслано!');
      setShowApplyModal(false);
      setAlreadyApplied(true);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!project) return <p>Проєкт не знайдено</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in-up">
      <Link to="/student/projects" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Назад до проєктів
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{project.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Building2 size={14} /> {project.company?.company_name}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> до {formatDate(project.deadline)}</span>
            <span className="flex items-center gap-1.5"><Users size={14} /> макс. {project.max_applicants}</span>
          </div>
        </div>
        <Badge variant={project.status === 'open' ? 'success' : 'default'} className="text-sm">
          {project.status === 'open' ? 'Відкритий' : project.status === 'in_progress' ? 'В роботі' : project.status === 'completed' ? 'Завершено' : 'Скасовано'}
        </Badge>
      </div>

      {/* Skills */}
      {project.skills && project.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.skills.map((s) => (
            <SkillTag key={s.id} name={s.name} />
          ))}
        </div>
      )}

      {/* Description */}
      <Card>
        <CardContent className="prose max-w-none p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Опис</h3>
          <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{project.description}</p>
        </CardContent>
      </Card>

      {/* Requirements */}
      {project.requirements && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Вимоги</h3>
            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{project.requirements}</p>
          </CardContent>
        </Card>
      )}

      {/* Company info */}
      {project.company && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Про компанію</h3>
            <p className="font-semibold text-slate-900">{project.company.company_name}</p>
            {project.company.website && (
              <a href={project.company.website} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 text-sm font-medium transition-colors">
                {project.company.website}
              </a>
            )}
            {project.company.description && (
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">{project.company.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply + Complain */}
      {user?.role === 'student' && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => setShowComplaint(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Flag size={12} /> Поскаржитись на компанію
          </button>
          {project.status === 'open' && (
            alreadyApplied
              ? <Button disabled>Заявку вже подано</Button>
              : <Button onClick={() => setShowApplyModal(true)}>Подати заявку</Button>
          )}
        </div>
      )}

      {/* Apply modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Подати заявку">
        <div className="space-y-4">
          <TextArea
            label="Супровідний лист (необов'язково)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Розкажіть, чому вас цікавить цей проєкт..."
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Скасувати
            </Button>
            <Button onClick={handleApply} isLoading={applying}>
              Надіслати заявку
            </Button>
          </div>
        </div>
      </Modal>

      {project.company?.user_id && (
        <ComplaintModal
          isOpen={showComplaint}
          onClose={() => setShowComplaint(false)}
          targetUserId={project.company.user_id}
          targetName={project.company.company_name}
        />
      )}
    </div>
  );
}
