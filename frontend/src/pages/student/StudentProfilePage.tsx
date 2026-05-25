import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { StudentProfile, Skill } from '../../types';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Skeleton';
import { SkillTag } from '../../components/shared/SkillTag';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';

export default function StudentProfile() {
  const { user, fetchUser } = useAuthStore();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          api.get(`/api/students/${user?.id}`),
          api.get('/api/skills'),
        ]);
        const p: StudentProfile = profileRes.data;
        setAllSkills(skillsRes.data);
        setUniversity(p.university || '');
        setBio(p.bio || '');

        setSelectedSkills((p.skills || []).map((s) => s.name));
      } catch {
        toast.error('Не вдалося завантажити профіль');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/students/me', {
        university: university || undefined,
        bio: bio || undefined,

        skill_names: selectedSkills,
      });
      await fetchUser();
      toast.success('Профіль оновлено');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
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

  const removeSkill = (name: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== name));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Мій профіль</h1>
        <p className="text-slate-500 mt-1">Редагування особистої інформації</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Особиста інформація</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Ім'я" value={user?.student_profile?.first_name || ''} disabled />
            <Input label="Прізвище" value={user?.student_profile?.last_name || ''} disabled />
          </div>
          <Input label="Email" value={user?.email || ''} disabled />
          <Input
            label="Університет"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="КПІ ім. Ігоря Сікорського"
          />
          <TextArea
            label="Про себе"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Коротко про ваш досвід та інтереси..."
            rows={3}
          />

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Навички</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((s) => (
              <SkillTag key={s} name={s} onRemove={() => removeSkill(s)} />
            ))}
            {selectedSkills.length === 0 && <p className="text-slate-400 text-sm">Додайте свої навички</p>}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
              placeholder="Введіть навичку..."
              className="flex-1"
            />
            <Button variant="outline" onClick={() => addSkill(newSkill)}>
              Додати
            </Button>
          </div>
          {allSkills.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Популярні:</p>
              <div className="flex flex-wrap gap-1.5">
                {allSkills.filter((s) => !selectedSkills.includes(s.name)).slice(0, 10).map((s) => (
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
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving}>
          Зберегти зміни
        </Button>
      </div>
    </div>
  );
}
