import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Project } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Skeleton';
import { Briefcase, Users, FileCheck, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function CompanyDashboard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/projects', { params: { company_id: user?.id, size: 100 } });
        const items: Project[] = res.data.items || res.data;
        setProjects(items);
        setStats({
          total: items.length,
          open: items.filter((p) => p.status === 'open').length,
          inProgress: items.filter((p) => p.status === 'in_progress').length,
          completed: items.filter((p) => p.status === 'completed').length,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Дашборд компанії</h1>
          <p className="text-slate-500 mt-1">Керуйте проєктами та знаходьте таланти</p>
        </div>
        <Link to="/company/projects/new">
          <Button><Plus size={16} /> Новий проєкт</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 animate-fade-in-up delay-100">
        {[
          { icon: <Briefcase size={22} />, label: 'Усього проєктів', value: stats.total, gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
          { icon: <FileCheck size={22} />, label: 'Відкритих', value: stats.open, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
          { icon: <Users size={22} />, label: 'В роботі', value: stats.inProgress, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
          { icon: <CheckCircle2 size={22} />, label: 'Завершених', value: stats.completed, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 !py-5">
              <div className={`p-3 rounded-xl ${s.bg}`}>
                <div className={`bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                  <div className="text-current">{s.icon}</div>
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-slate-500 text-sm font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-fade-in-up delay-200">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Мої проєкти</h2>
          <Link to="/company/projects">
            <Button variant="ghost" size="sm">Усі <ArrowRight size={14} /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-slate-400 text-sm">Створіть перший проєкт</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.slice(0, 5).map((p) => (
                <Link key={p.id} to={`/company/projects/${p.id}`} className="flex items-center justify-between py-3.5 hover:bg-slate-50 -mx-6 px-6 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">до {formatDate(p.deadline)}</p>
                  </div>
                  <Badge variant={p.status === 'open' ? 'success' : p.status === 'in_progress' ? 'warning' : 'default'}>
                    {p.status === 'open' ? 'Відкритий' : p.status === 'in_progress' ? 'В роботі' : p.status === 'completed' ? 'Завершено' : 'Скасовано'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
