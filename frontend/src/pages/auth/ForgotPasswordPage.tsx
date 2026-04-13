import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Mail, KeyRound, Copy, Check, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.data.reset_token) {
        // Dev mode — token returned directly
        setResetToken(res.data.reset_token);
        toast.success('Токен сформовано!');
      } else {
        // Production — email was sent
        setEmailSent(true);
        toast.success('Лист надіслано на вашу пошту!');
      }
    } catch {
      toast.error('Помилка. Перевірте email та спробуйте знову.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (!resetToken) return;
    navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопійовано!');
  };

  const resetLink = resetToken
    ? `${window.location.origin}/reset-password?token=${resetToken}`
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Work</span>
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">Hive</span>
          </h1>
          <p className="text-slate-500 mt-2">Відновлення пароля</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Лист надіслано!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Перевірте <strong>{email}</strong> — там буде посилання для скидання пароля.<br />
                  Лист дійсний 30 хвилин.
                </p>
              </div>
            </div>
          ) : !resetToken ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-sm text-slate-600">
                  Введіть email вашого акаунту — ми сформуємо токен для скидання пароля.
                </p>
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
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Отримати токен
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  Токен сформовано. Дійсний 30 хвилин.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Reset токен</p>
                <p className="text-xs font-mono text-slate-700 break-all leading-relaxed">{resetToken}</p>
                <button
                  onClick={copyToken}
                  className="mt-3 flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Скопійовано' : 'Скопіювати токен'}
                </button>
              </div>

              <Link
                to={resetLink!}
                className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Перейти до скидання пароля →
              </Link>
            </div>
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
