import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Skill } from '../../types';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { SkillTag } from '../../components/shared/SkillTag';
import toast from 'react-hot-toast';

export default function CreateProject() {
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxStudents, setMaxStudents] = useState('5');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    api.get('/api/skills').then((r) => setAllSkills(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/api/projects', {
        title,
        description,
        requirements: requirements || undefined,
        deadline,
        max_applicants: Number(maxStudents) || 5,
        skill_names: selectedSkills,
      });
      toast.success('Проєкт створено');
      navigate(`/company/projects/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selectedSkills.includes(trimmed)) return;
    setSelectedSkills([...selectedSkills, trimmed]);
    setNewSkill('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-black text-slate-900">Створити проєкт</h1>
        <p className="text-slate-500 mt-1">Опишіть завдання для студентів</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><h2 className="text-lg font-bold text-slate-900">Основна інформація</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Назва проєкту" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Розробка мобільного додатку..." required />
            <TextArea label="Опис" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Детальний опис завдання для студентів..." rows={5} required />
            <TextArea label="Вимоги (необов'язково)" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Необхідні знання та навички..." rows={3} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Дедлайн" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              <Input label="Макс. студентів" type="number" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} min={1} max={50} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-bold text-slate-900">Навички</h2></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((s) => (
                <SkillTag key={s} name={s} onRemove={() => setSelectedSkills(selectedSkills.filter((x) => x !== s))} />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
                placeholder="Додати навичку..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => addSkill(newSkill)}>Додати</Button>
            </div>
            {allSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allSkills.filter((s) => !selectedSkills.includes(s.name)).slice(0, 10).map((s) => (
                  <button key={s.id} type="button" onClick={() => addSkill(s.name)} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 font-medium">
                    + {s.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Скасувати</Button>
          <Button type="submit" isLoading={saving}>Створити проєкт</Button>
        </div>
      </form>
    </div>
  );
}
