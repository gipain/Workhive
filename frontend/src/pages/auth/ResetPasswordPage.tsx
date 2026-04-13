import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Токен відсутній. Поверніться до сторінки відновлення пароля.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Пароль має бути не менше 8 символів');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, new_password: newPassword });
      setDone(true);
      toast.success('Пароль успішно змінено!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка скидання пароля';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Work</span>
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">Hive</span>
          </h1>
          <p className="text-slate-500 mt-2">Встановлення нового пароля</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
          {!token ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Токен відсутній</p>
                <p className="text-sm text-red-600 mt-1">
                  Перейдіть до{' '}
                  <Link to="/forgot-password" className="underline font-medium">
                    сторінки відновлення пароля
                  </Link>{' '}
                  і отримайте токен.
                </p>
              </div>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Пароль змінено!</p>
                <p className="text-sm text-slate-500 mt-1">Перенаправлення до входу…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Новий пароль"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Мінімум 8 символів"
                required
              />
              <Input
                label="Підтвердіть пароль"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Встановити новий пароль
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link to="/login" className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 font-semibold transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Назад до входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
