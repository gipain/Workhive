import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { StudentProfile } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { PageLoader } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkillTag } from '../../components/shared/SkillTag';
import { RatingStars } from '../../components/shared/RatingStars';
import { Search, Send, GraduationCap, Flag } from 'lucide-react';
import { useDebounce } from '../../hooks/useApi';
import toast from 'react-hot-toast';
import type { Skill, Project } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { ComplaintModal } from '../../components/shared/ComplaintModal';

export default function BrowseStudents() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteStudent, setInviteStudent] = useState<StudentProfile | null>(null);
  const [inviteProjectId, setInviteProjectId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  // Complaint modal
  const [complaintStudent, setComplaintStudent] = useState<StudentProfile | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const skillFilter = searchParams.get('skill') || '';
  const limit = 12;
  const debouncedSearch = useDebounce(search, 400);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (skillFilter) params.skill = skillFilter;
      const res = await api.get('/api/students', { params });
      setStudents(res.data.items || res.data);
      setTotal(res.data.total || (res.data.items || res.data).length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, skillFilter]);

  useEffect(() => {
    Promise.all([
      api.get('/api/skills'),
      api.get('/api/projects', { params: { company_id: user?.id, status: 'open', size: 100 } }),
    ]).then(([skillsRes, projRes]) => {
      setSkills(skillsRes.data);
      setMyProjects(projRes.data.items || projRes.data);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value);
    else sp.delete(key);
    if (key !== 'page') sp.set('page', '1');
    setSearchParams(sp);
  };

  const handleInvite = async () => {
    if (!inviteStudent || !inviteProjectId) return;
    setInviting(true);
    try {
      await api.post('/api/invitations', {
        student_id: inviteStudent.user_id,
        project_id: inviteProjectId,
        message: inviteMessage || undefined,
      });
      toast.success('Запрошення надіслано');
      setInviteModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-black text-slate-900">Знайти студента</h1>
        <p className="text-slate-500 mt-1">Знайдіть ідеального кандидата для вашого проєкту</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 animate-fade-in-up delay-100">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук студентів..."
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
      </div>

      {loading ? (
        <PageLoader />
      ) : students.length === 0 ? (
        <EmptyState title="Студентів не знайдено" description="Спробуйте змінити фільтри" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.map((s) => (
              <Card key={s.user_id} hover>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{s.first_name} {s.last_name}</p>
                      {s.university && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <GraduationCap size={12} /> {s.university}
                        </p>
                      )}
                    </div>
                    <RatingStars rating={s.rating_avg || 0} />
                  </div>
                  {s.bio && <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{s.bio}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(s.skills || []).slice(0, 4).map((sk) => (
                      <SkillTag key={sk.id} name={sk.name} />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => { setInviteStudent(s); setInviteProjectId(myProjects[0]?.id || ''); setInviteMessage(''); setInviteModal(true); }}
                  >
                    <Send size={14} /> Запросити до проєкту
                  </Button>
                  <button
                    onClick={() => setComplaintStudent(s)}
                    className="w-full text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1 py-1"
                  >
                    <Flag size={11} /> Поскаржитись
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={(p) => setParam('page', String(p))} />
        </>
      )}

      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title={`Запросити ${inviteStudent?.first_name || ''}`}>
        <div className="space-y-4">
          <Select
            label="Проєкт"
            value={inviteProjectId}
            onChange={(e) => setInviteProjectId(e.target.value)}
            options={myProjects.map((p) => ({ value: p.id, label: p.title }))}
            required
          />
          <TextArea
            label="Повідомлення (необов'язково)"
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder="Чому вас зацікавив цей студент..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setInviteModal(false)}>Скасувати</Button>
            <Button onClick={handleInvite} isLoading={inviting} disabled={!inviteProjectId}>Надіслати</Button>
          </div>
        </div>
      </Modal>

      {complaintStudent && (
        <ComplaintModal
          isOpen={!!complaintStudent}
          onClose={() => setComplaintStudent(null)}
          targetUserId={complaintStudent.user_id}
          targetName={`${complaintStudent.first_name} ${complaintStudent.last_name}`}
        />
      )}
    </div>
  );
}
