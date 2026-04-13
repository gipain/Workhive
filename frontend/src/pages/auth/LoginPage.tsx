import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      const { user } = useAuthStore.getState();
      toast.success('Ласкаво просимо!');
      navigate(`/${user?.role}/dashboard`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка входу';
      toast.error(message);
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
          <p className="text-slate-500 mt-2">Увійдіть до свого акаунту</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-indigo-500 transition-colors">
                Забули пароль?
              </Link>
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Увійти
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Немає акаунту?{' '}
            <Link to="/register" className="text-indigo-500 hover:text-indigo-600 font-semibold transition-colors">
              Зареєструватися
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
