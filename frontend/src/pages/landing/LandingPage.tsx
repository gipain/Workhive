import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Briefcase, GraduationCap, Award, ArrowRight, CheckCircle,
  Sparkles, Users, Shield, Star, Zap, TrendingUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="w-full overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden noise-overlay"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #1e1b4b 0%, #0f172a 60%, #030712 100%)' }}
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div
            className="animate-blob absolute rounded-full opacity-25"
            style={{
              width: 700, height: 700,
              background: 'radial-gradient(circle at 30% 40%, #6366f1, transparent 65%)',
              top: '-20%', left: '-15%',
            }}
          />
          <div
            className="animate-blob-delay-1 absolute rounded-full opacity-20"
            style={{
              width: 600, height: 600,
              background: 'radial-gradient(circle at 60% 40%, #a855f7, transparent 65%)',
              top: '10%', right: '-15%',
            }}
          />
          <div
            className="animate-blob-delay-2 absolute rounded-full"
            style={{
              width: 400, height: 400,
              background: 'radial-gradient(circle at 50% 50%, #8b5cf6, transparent 65%)',
              bottom: '-5%', left: '35%',
              opacity: 0.12,
            }}
          />
          {/* Dot grid */}
          <div className="absolute inset-0 dot-grid opacity-50" />
          {/* Vertical lines */}
          <div className="hero-line-left" />
          <div className="hero-line-right" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-44">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* ── LEFT – Text ───────────────────────────────── */}
            <div className="animate-fade-in-up">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-10"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#a5b4fc',
                }}
              >
                <Sparkles size={14} className="text-indigo-400" />
                Платформа практичного досвіду
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-black leading-[0.88] tracking-tight mb-8">
                <span className="block text-white text-6xl sm:text-7xl xl:text-8xl">Work</span>
                <span className="block shimmer-text text-7xl sm:text-8xl xl:text-9xl">Hive</span>
                <span className="block text-white/35 text-3xl sm:text-4xl xl:text-5xl font-bold mt-3 tracking-wide">
                  Student Platform
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300/80 mb-10 leading-relaxed max-w-md">
                З'єднуємо{' '}
                <span className="text-indigo-300 font-semibold">студентів</span>{' '}
                з реальними проєктами від{' '}
                <span className="text-violet-300 font-semibold">компаній</span>.{' '}
                Отримуйте досвід, формуйте портфоліо, здобувайте сертифікати.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 mb-16">
                {isAuthenticated ? (
                  <Link to={`/${user?.role}/dashboard`}>
                    <Button size="lg" className="btn-shimmer !shadow-2xl !shadow-indigo-500/40">
                      До дашборду <ArrowRight size={18} />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" className="btn-shimmer !shadow-2xl !shadow-indigo-500/40 !px-8 !py-3.5 !text-base">
                        Почати безкоштовно <ArrowRight size={18} />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button
                        size="lg" variant="ghost"
                        className="!text-white/80 hover:!text-white !border !border-white/20 hover:!border-white/40 hover:!bg-white/8 !px-8 !py-3.5 !text-base"
                      >
                        Увійти
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { value: '500+', label: 'Студентів', icon: '🎓' },
                  { value: '50+', label: 'Компаній', icon: '🏢' },
                  { value: '200+', label: 'Проєктів', icon: '🚀' },
                ].map((stat) => (
                  <div key={stat.label} className="animate-fade-in-up delay-400">
                    <div className="text-3xl sm:text-4xl font-black stat-number">{stat.value}</div>
                    <div className="text-slate-400 text-xs sm:text-sm mt-1">{stat.icon} {stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT – Floating UI Preview ───────────────── */}
            <div className="hidden lg:block relative h-[540px] animate-fade-in-up delay-300">
              {/* Glow behind cards */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] pointer-events-none"
                style={{ width: 340, height: 340, background: 'rgba(99,102,241,0.18)' }}
              />

              {/* Main project card */}
              <div
                className="animate-float absolute top-4 left-2 right-2 rounded-2xl p-5"
                style={{
                  background: 'rgba(15,23,42,0.88)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(99,102,241,0.28)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Briefcase size={17} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">Frontend Developer Intern</p>
                    <p className="text-slate-400 text-xs">TechCorp Ukraine · до 15.05.2026</p>
                  </div>
                  <span
                    className="px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    Відкрито
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['React', 'TypeScript', 'Tailwind CSS'].map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs rounded-lg font-medium"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mb-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-1.5 w-3/5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                  </div>
                </div>
                <p className="text-slate-500 text-xs mb-4">3 з 5 місць зайнято</p>

                <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex -space-x-2">
                    {['bg-purple-400', 'bg-indigo-400', 'bg-blue-400'].map((bg, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center text-[9px] font-bold text-white`}
                        style={{ border: '2px solid rgba(15,23,42,0.8)' }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs">+2 заявки</p>
                  <div className="ml-auto flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-slate-400 text-xs ml-1">4.9</span>
                  </div>
                </div>
              </div>

              {/* Trend chip */}
              <div
                className="absolute top-3 right-0 rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-indigo-400" />
                  <span className="text-indigo-300 text-xs font-bold">+34% цього місяця</span>
                </div>
              </div>

              {/* Success notification */}
              <div
                className="animate-float-delay-1 absolute bottom-36 right-0 rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(15,23,42,0.92)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 12px 40px rgba(16,185,129,0.15)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <CheckCircle size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Заявку прийнято!</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Frontend Developer · щойно</p>
                  </div>
                </div>
              </div>

              {/* Certificate chip */}
              <div
                className="animate-float-delay-2 absolute bottom-8 left-4 rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(15,23,42,0.92)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  boxShadow: '0 12px 40px rgba(245,158,11,0.12)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                    <Award size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Сертифікат отримано 🎉</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade to page bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8fafc)' }}
        />
      </section>

      {/* ── TRUSTED BY ─────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-center text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-8">
            Нам довіряють
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-20">
            {['TechCorp', 'DevStudio', 'Innovate UA', 'DigitalHub', 'CodeLab'].map((name) => (
              <span
                key={name}
                className="text-slate-200 hover:text-slate-400 font-black text-lg tracking-tight transition-colors duration-300 cursor-default select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-28">
        <div className="text-center mb-20 animate-fade-in-up">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Zap size={12} /> Як це працює
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Три кроки до{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              успіху
            </span>
          </h2>
          <p className="text-slate-500 mt-4 max-w-sm mx-auto text-sm">
            Від реєстрації до сертифікату — все в одному місці
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector */}
          <div
            className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px"
            style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' }}
          />

          {[
            {
              icon: <Briefcase size={26} />,
              gradient: 'from-indigo-500 to-blue-500',
              glow: 'icon-glow-indigo',
              title: 'Компанії публікують',
              desc: 'Бізнес створює реальні проєкти з дедлайнами, вимогами до навичок та описом задач.',
              step: '01',
              delay: 'delay-100',
            },
            {
              icon: <GraduationCap size={26} />,
              gradient: 'from-violet-500 to-purple-500',
              glow: 'icon-glow-violet',
              title: 'Студенти виконують',
              desc: 'Знаходьте цікаві проєкти, подавайте заявки, виконуйте завдання та здавайте результати.',
              step: '02',
              delay: 'delay-200',
            },
            {
              icon: <Award size={26} />,
              gradient: 'from-amber-400 to-orange-500',
              glow: 'icon-glow-amber',
              title: 'Отримуйте сертифікати',
              desc: 'Після успішного виконання автоматично генерується PDF-сертифікат для вашого резюме.',
              step: '03',
              delay: 'delay-300',
            },
          ].map((f, i) => (
            <div
              key={i}
              className={`group relative bg-white rounded-3xl p-8 text-center card-glow border border-slate-100 animate-fade-in-up ${f.delay}`}
            >
              <div className="absolute top-5 right-6 text-6xl font-black text-slate-100 select-none leading-none group-hover:text-indigo-100 transition-colors duration-300">
                {f.step}
              </div>
              <div
                className={`mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white ${f.glow} transition-all duration-300 group-hover:scale-110`}
              >
                {f.icon}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-28"
        style={{ background: 'linear-gradient(180deg, #fafbff 0%, #f0f4ff 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20 animate-fade-in-up">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{ background: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <Star size={12} /> Переваги
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Для кожного свій{' '}
              <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                шлях
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Students */}
            <div
              className="relative rounded-3xl p-8 sm:p-10 overflow-hidden group animate-fade-in-up delay-100"
              style={{
                background: 'white',
                border: '1px solid rgba(99,102,241,0.15)',
                boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
                transition: 'box-shadow 0.3s, transform 0.3s',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(139,92,246,0.06))' }}
              />
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
              />
              <div className="relative flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/25 icon-glow-indigo">
                  <Users size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Для студентів</h3>
                  <p className="text-slate-400 text-sm">Побудуй кар'єру з нуля</p>
                </div>
              </div>
              <ul className="space-y-4 relative">
                {[
                  'Реальні проєкти без комерційного досвіду',
                  'Формування портфоліо з підтвердженням',
                  'Рейтингова система та відгуки компаній',
                  'Автоматичні PDF-сертифікати',
                  'Прямі запрошення від компаній',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm shadow-indigo-500/25">
                      <CheckCircle size={11} className="text-white" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Companies */}
            <div
              className="relative rounded-3xl p-8 sm:p-10 overflow-hidden group animate-fade-in-up delay-200"
              style={{
                background: 'white',
                border: '1px solid rgba(139,92,246,0.15)',
                boxShadow: '0 4px 24px rgba(139,92,246,0.06)',
                transition: 'box-shadow 0.3s, transform 0.3s',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.03), rgba(168,85,247,0.06))' }}
              />
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}
              />
              <div className="relative flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 icon-glow-violet">
                  <Shield size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Для компаній</h3>
                  <p className="text-slate-400 text-sm">Знайди таланти швидше</p>
                </div>
              </div>
              <ul className="space-y-4 relative">
                {[
                  'Доступ до мотивованих початківців',
                  'Швидкий підбір за навичками',
                  'Система заявок та запрошень',
                  'Контроль якості через рецензування',
                  'Зменшення витрат на рутинні задачі',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-500 shadow-sm shadow-violet-500/25">
                      <CheckCircle size={11} className="text-white" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-28">
          <div
            className="relative overflow-hidden rounded-3xl text-white text-center py-24 px-8"
            style={{ background: 'radial-gradient(ellipse at top, #4338ca 0%, #1e1b4b 55%, #0f172a 100%)' }}
          >
            <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
            <div
              className="absolute -top-28 -right-28 w-80 h-80 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(139,92,246,0.4)' }}
            />
            <div
              className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(99,102,241,0.4)' }}
            />

            <div className="relative animate-fade-in-up">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#c7d2fe', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Sparkles size={12} /> Починай прямо зараз
              </div>
              <h2 className="text-5xl sm:text-7xl font-black mb-5 tracking-tight">
                Готові почати?
              </h2>
              <p className="text-indigo-200/70 mb-10 text-lg max-w-sm mx-auto leading-relaxed">
                Приєднуйтесь до WorkHive сьогодні — безкоштовно та без зайвих кроків
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="btn-shimmer !bg-white !text-indigo-700 hover:!bg-indigo-50 !shadow-2xl !shadow-black/30 !font-black !px-10 !py-4 !text-base"
                  >
                    Зареєструватися <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg" variant="ghost"
                    className="!text-white/80 hover:!text-white !border !border-white/20 hover:!bg-white/10 !px-10 !py-4 !text-base"
                  >
                    Вже є акаунт?
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
