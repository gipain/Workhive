import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchUnreadCount();
  }, [isAuthenticated, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (!user) return [];
    const base = `/${user.role}`;
    switch (user.role) {
      case 'student':
        return [
          { to: `${base}/dashboard`, label: 'Дашборд' },
          { to: `${base}/projects`, label: 'Проєкти' },
          { to: `${base}/applications`, label: 'Мої заявки' },
          { to: `${base}/certificates`, label: 'Сертифікати' },
          { to: `${base}/profile`, label: 'Профіль' },
        ];
      case 'company':
        return [
          { to: `${base}/dashboard`, label: 'Дашборд' },
          { to: `${base}/projects`, label: 'Мої проєкти' },
          { to: `${base}/students`, label: 'Студенти' },
          { to: `${base}/profile`, label: 'Профіль' },
        ];
      case 'admin':
        return [
          { to: `${base}/dashboard`, label: 'Дашборд' },
          { to: `${base}/users`, label: 'Користувачі' },
          { to: `${base}/complaints`, label: 'Скарги' },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
      {/* Gradient accent line at top */}
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-0.5 group hover:scale-105 transition-transform duration-200">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Work
            </span>
            <span className="text-2xl font-black bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
              Hive
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {getNavLinks().map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 text-sm rounded-xl transition-all duration-200 ${
                    location.pathname === link.to
                      ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 font-bold shadow-sm border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={`/${user?.role}/notifications`}
                  className="relative p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm shadow-red-500/30">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <LogOut size={20} />
                </button>
                <button className="md:hidden p-2.5 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Увійти
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl hover:from-indigo-600 hover:to-violet-600 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                >
                  Реєстрація
                </Link>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && isAuthenticated && (
          <div className="md:hidden py-3 border-t border-slate-100 animate-slide-down">
            {getNavLinks().map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3.5 py-2.5 text-sm rounded-xl mb-0.5 ${
                  location.pathname === link.to
                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 font-medium'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
