import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Certificate } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { Award, Download } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudentCertificates() {
  const { user } = useAuthStore();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/certificates/student/${user.id}`)
      .then((r) => setCerts(r.data.items ?? r.data))
      .catch(() => toast.error('Не вдалося завантажити сертифікати'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleDownload = async (certId: string, projectTitle: string) => {
    setDownloading(certId);
    try {
      const response = await api.get(`/api/certificates/${certId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const safe = projectTitle.replace(/[^a-zA-Z0-9а-яА-ЯіІїЇєЄ]/g, '_').slice(0, 40);
      link.setAttribute('download', `workhive_certificate_${safe}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Не вдалося завантажити PDF. Спробуйте ще раз.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Мої сертифікати</h1>
        <p className="text-slate-500 mt-1">Ваші підтверджені досягнення</p>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          title="Сертифікатів поки немає"
          description="Завершіть проєкт та отримайте відгук від компанії, щоб отримати сертифікат"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certs.map((c) => (
            <Card key={c.id} hover>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/25">
                    <Award size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{c.project?.title ?? 'Проєкт'}</p>
                    <p className="text-xs text-slate-500">{c.project?.company?.company_name}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Видано {formatDate(c.issued_at)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  isLoading={downloading === c.id}
                  onClick={() => handleDownload(c.id, c.project?.title ?? 'certificate')}
                >
                  <Download size={14} /> Завантажити PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
