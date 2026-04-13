import { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { CheckCheck } from 'lucide-react';
import { timeAgo } from '../../utils/helpers';

export default function NotificationsPage() {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (isLoading) return <PageLoader />;

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Сповіщення</h1>
          <p className="text-slate-500 mt-1">{unread.length > 0 ? `${unread.length} непрочитаних` : 'Все прочитано'}</p>
        </div>
        {unread.length > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            <CheckCheck size={14} /> Прочитати всі
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Сповіщень немає" description="Тут з'являтимуться ваші сповіщення" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`transition-all duration-200 ${!n.is_read ? 'bg-indigo-50/50 border-indigo-200/60' : ''}`}>
              <CardContent className="flex items-start gap-3 py-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markAsRead(n.id)} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex-shrink-0 transition-colors">
                    Прочитано
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
