import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import type { Project, Skill } from '../../types';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { SkillTag } from '../../components/shared/SkillTag';
import { PageLoader } from '../../components/ui/Skeleton';
import { ArrowLeft, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';
import { Link } from 'react-router-dom';

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxStudents, setMaxStudents] = useState('5');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, skillsRes] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get('/api/skills'),
        ]);
        const p: Project = projRes.data;
        setProject(p);
        setTitle(p.title);
        setDescription(p.description);
        setRequirements(p.requirements ?? '');
        // Extract YYYY-MM-DD from ISO datetime string
        setDeadline(p.deadline ? p.deadline.toString().split('T')[0] : '');
        setMaxStudents(String(p.max_applicants));
        setSelectedSkills(p.skills.map((s) => s.name));
        setAllSkills(skillsRes.data);
      } catch {
        toast.error('Не вдалося завантажити проєкт');
        navigate('/company/projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const validate = (): boolean => {
    if (title.trim().length < 3) { toast.error('Назва має містити мінімум 3 символи'); return false; }
    if (description.trim().length < 10) { toast.error('Опис має містити мінімум 10 символів'); return false; }
    if (!deadline) { toast.error('Вкажіть дедлайн'); return false; }
    return true;
  };

  const saveChanges = async (): Promise<boolean> => {
    if (!validate()) return false;
    setSaving(true);
    try {
      await api.put(`/api/projects/${id}`, {
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim() || null,
        deadline,
        max_applicants: Number(maxStudents) || 5,
        skill_names: selectedSkills,
      });
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveChanges();
    if (ok) {
      toast.success('Зміни збережено');
      navigate(`/company/projects/${id}`);
    }
  };

  const handleSaveAndPublish = async () => {
    const ok = await saveChanges();
    if (!ok) return;
    setPublishing(true);
    try {
      await api.patch(`/api/projects/${id}/publish`);
      toast.success('Проєкт опубліковано');
      navigate(`/company/projects/${id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selectedSkills.includes(trimmed)) return;
    setSelectedSkills([...selectedSkills, trimmed]);
    setNewSkill('');
  };

  if (loading) return <PageLoader />;
  if (!project) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="animate-fade-in-up">
        <Link
          to={`/company/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Назад до проєкту
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900">Редагування проєкту</h1>
          {project.is_draft && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
              Чернетка
            </span>
          )}
        </div>
        <p className="text-slate-500 mt-1">Внесіть зміни і збережіть або відразу опублікуйте</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><h2 className="text-lg font-bold text-slate-900">Основна інформація</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Назва проєкту"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Розробка мобільного додатку..."
              required
            />
            <TextArea
              label="Опис"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Детальний опис завдання для студентів..."
              rows={5}
              required
            />
            <TextArea
              label="Вимоги (необов'язково)"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Необхідні знання та навички..."
              rows={3}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Дедлайн"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Макс. студентів"
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                min={1}
                max={50}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-bold text-slate-900">Навички</h2></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((s) => (
                <SkillTag
                  key={s}
                  name={s}
                  onRemove={() => setSelectedSkills(selectedSkills.filter((x) => x !== s))}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); }
                }}
                placeholder="Додати навичку..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => addSkill(newSkill)}>
                Додати
              </Button>
            </div>
            {allSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allSkills
                  .filter((s) => !selectedSkills.includes(s.name))
                  .slice(0, 10)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addSkill(s.name)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 font-medium"
                    >
                      + {s.name}
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/company/projects/${id}`)}>
            Скасувати
          </Button>
          <Button type="submit" variant="secondary" isLoading={saving}>
            Зберегти зміни
          </Button>
          {project.is_draft && (
            <Button
              type="button"
              isLoading={publishing || saving}
              onClick={handleSaveAndPublish}
            >
              <Globe size={15} /> Зберегти та опублікувати
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
