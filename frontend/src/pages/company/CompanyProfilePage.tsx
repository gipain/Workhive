import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { CompanyProfile } from '../../types';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function CompanyProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    api.get(`/api/companies/${user?.id}`)
      .then((r) => {
        const p: CompanyProfile = r.data;
        setCompanyName(p.company_name || '');
        setDescription(p.description || '');
        setWebsite(p.website || '');
        setLogoUrl(p.logo_url || '');
      })
      .catch(() => toast.error('Не вдалося завантажити профіль'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/companies/me', {
        company_name: companyName || undefined,
        description: description || undefined,
        website: website || undefined,
        logo_url: logoUrl || undefined,
      });
      await fetchUser();
      toast.success('Профіль оновлено');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Профіль компанії</h1>
        <p className="text-slate-500 mt-1">Редагування інформації про компанію</p>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Інформація</h2></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Email" value={user?.email || ''} disabled />
          <Input label="Назва компанії" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="ТОВ «Приклад»" />
          <TextArea label="Опис" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Про вашу компанію..." rows={4} />
          <Input label="Вебсайт" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          <Input label="URL логотипу" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving}>Зберегти зміни</Button>
      </div>
    </div>
  );
}
