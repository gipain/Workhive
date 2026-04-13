import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Project, Application, Certificate } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Skeleton';
import { Briefcase, FileCheck, Award, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ projects: 0, applications: 0, certificates: 0 });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, appRes, certRes] = await Promise.all([
          api.get('/api/projects', { params: { size: 5 } }),
          api.get('/api/applications/my'),
          api.get(`/api/certificates/student/${user?.id}`),
        ]);
        setRecentProjects(projRes.data.items || projRes.data);
        setMyApplications(appRes.data.items || appRes.data);
        const certs: Certificate[] = certRes.data.items || certRes.data;
        setStats({
          projects: (appRes.data.items || appRes.data).filter((a: Application) => a.status === 'accepted').length,
          applications: (appRes.data.items || appRes.data).length,
          certificates: certs.length,
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
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-black text-slate-900">
          Привіт, {user?.student_profile?.first_name || 'Студент'}! 👋
        </h1>
        <p className="text-slate-500 mt-1">Ось що відбувається у вашому просторі</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fade-in-up delay-100">
        {[
          { icon: <Briefcase size={22} />, label: 'Активних проєктів', value: stats.projects, gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
          { icon: <FileCheck size={22} />, label: 'Заявок', value: stats.applications, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
          { icon: <Award size={22} />, label: 'Сертифікатів', value: stats.certificates, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
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

      {/* Recent projects */}
      <Card className="animate-fade-in-up delay-200">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Нові проєкти</h2>
          <Link to="/student/projects">
            <Button variant="ghost" size="sm">
              Усі проєкти <ArrowRight size={14} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-slate-400 text-sm">Поки немає проєктів</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentProjects.map((p) => (
                <Link key={p.id} to={`/student/projects/${p.id}`} className="flex items-center justify-between py-3.5 hover:bg-slate-50 -mx-6 px-6 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{p.company?.company_name} · до {formatDate(p.deadline)}</p>
                  </div>
                  <Badge variant="default">{p.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My applications */}
      <Card className="animate-fade-in-up delay-300">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Мої заявки</h2>
          <Link to="/student/applications">
            <Button variant="ghost" size="sm">
              Усі заявки <ArrowRight size={14} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {myApplications.length === 0 ? (
            <p className="text-slate-400 text-sm">Ви ще не подавали заявок</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myApplications.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{a.project?.title || 'Проєкт'}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{formatDate(a.created_at)}</p>
                  </div>
                  <Badge variant={a.status === 'accepted' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}>
                    {a.status === 'accepted' ? 'Прийнято' : a.status === 'rejected' ? 'Відхилено' : 'Очікує'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
