import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Invitation } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudentInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/invitations/my')
      .then((r) => setInvitations(r.data.items || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const respond = async (id: string, action: 'accept' | 'decline') => {
    setActing(id);
    try {
      await api.patch(`/api/invitations/${id}/${action}`);
      setInvitations((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: action === 'accept' ? 'accepted' : 'declined' } : inv));
      toast.success(action === 'accept' ? 'Запрошення прийнято' : 'Запрошення відхилено');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setActing(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Запрошення</h1>
        <p className="text-sm text-slate-500 mt-0.5">Запрошення від компаній до проєктів</p>
      </div>

      {invitations.length === 0 ? (
        <EmptyState title="Запрошень немає" description="Компанії зможуть запрошувати вас до проєктів" />
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex items-center justify-between py-4 gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{inv.project?.title || 'Проєкт'}</p>
                  <p className="text-xs text-slate-500">
                    Від {inv.company?.company_name || 'Компанії'} · {formatDate(inv.created_at)}
                  </p>
                  {inv.message && <p className="text-sm text-slate-600 mt-1">{inv.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {inv.status === 'pending' ? (
                    <>
                      <Button size="sm" onClick={() => respond(inv.id, 'accept')} isLoading={acting === inv.id}>
                        Прийняти
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(inv.id, 'decline')} isLoading={acting === inv.id}>
                        Відхилити
                      </Button>
                    </>
                  ) : (
                    <Badge variant={inv.status === 'accepted' ? 'success' : 'danger'}>
                      {inv.status === 'accepted' ? 'Прийнято' : 'Відхилено'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
