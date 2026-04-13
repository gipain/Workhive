import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'company'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({
        email,
        password,
        role,
        first_name: role === 'student' ? firstName : undefined,
        last_name: role === 'student' ? lastName : undefined,
        company_name: role === 'company' ? companyName : undefined,
      });
      const { user } = useAuthStore.getState();
      toast.success('Реєстрація успішна!');
      navigate(`/${user?.role}/dashboard`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка реєстрації';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Work</span>
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">Hive</span>
          </h1>
          <p className="text-slate-500 mt-2">Створіть акаунт</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                role === 'student'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Студент
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                role === 'company'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Компанія
            </button>
          </div>

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
              placeholder="Мінімум 8 символів"
              minLength={8}
              required
            />

            {role === 'student' ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ім'я"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Іван"
                  required
                />
                <Input
                  label="Прізвище"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Петренко"
                  required
                />
              </div>
            ) : (
              <Input
                label="Назва компанії"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ТОВ «Приклад»"
                required
              />
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Зареєструватися
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Вже є акаунт?{' '}
            <Link to="/login" className="text-indigo-500 hover:text-indigo-600 font-semibold transition-colors">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
