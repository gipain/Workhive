import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Skeleton';
import { Users, Briefcase, FileCheck, AlertTriangle } from 'lucide-react';

interface Stats {
  total_users: number;
  total_students: number;
  total_companies: number;
  total_projects: number;
  open_projects: number;
  total_applications: number;
  total_complaints: number;
  pending_complaints: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const cards = [
    { icon: <Users size={24} />, label: 'Користувачів', value: stats?.total_users || 0, sub: `${stats?.total_students || 0} студентів · ${stats?.total_companies || 0} компаній`, iconBg: 'bg-indigo-100 text-indigo-600' },
    { icon: <Briefcase size={24} />, label: 'Проєктів', value: stats?.total_projects || 0, sub: `${stats?.open_projects || 0} відкритих`, iconBg: 'bg-emerald-100 text-emerald-600' },
    { icon: <FileCheck size={24} />, label: 'Заявок', value: stats?.total_applications || 0, sub: '', iconBg: 'bg-amber-100 text-amber-600' },
    { icon: <AlertTriangle size={24} />, label: 'Скарг', value: stats?.total_complaints || 0, sub: `${stats?.pending_complaints || 0} на розгляді`, iconBg: 'bg-rose-100 text-rose-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Адмін панель</h1>
        <p className="text-slate-500 mt-1">Загальна статистика платформи</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <Card key={c.label} hover className={`animate-fade-in-up delay-${(i + 1) * 100}`}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.iconBg}`}>{c.icon}</div>
              <div>
                <p className="text-2xl font-black text-slate-900">{c.value}</p>
                <p className="text-slate-500 text-sm font-medium">{c.label}</p>
                {c.sub && <p className="text-slate-400 text-xs mt-0.5">{c.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
