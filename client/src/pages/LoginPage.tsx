import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Sun, Moon, Languages } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { auth } from '../lib/api';
import logoLight from '../assets/kanbot-logo.svg';
import logoDark  from '../assets/kanbot-logo-dark.svg';

export function LoginPage() {
  const { login }               = useAuth();
  const { t, toggleLang }       = useLang();
  const [dark, setDark]         = useDarkMode();
  const navigate                = useNavigate();
  const [searchParams]          = useSearchParams();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const redirectTo = searchParams.get('redirect') ?? '/projects';
  const expired    = searchParams.get('expired') === '1';

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await auth.login(form);
      login(data.token, data.user);
      navigate(decodeURIComponent(redirectTo), { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.loginFailed);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4
                    bg-gray-100 dark:bg-[#0b0f1a] transition-colors
                    dark:[background-image:radial-gradient(ellipse_at_top,_#1a2744_0%,_#0b0f1a_60%)]">

      {/* Language + Dark mode toggles — top right */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleLang}
          className="w-8 h-8 p-0 rounded-lg border flex items-center justify-center
                     bg-white dark:bg-surface-700 border-gray-200 dark:border-surface-500
                     text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-600
                     transition-colors"
        >
          <Languages size={14} />
        </button>
        <button
          onClick={() => setDark((d) => !d)}
          className="w-8 h-8 p-0 rounded-lg border flex items-center justify-center
                     bg-white dark:bg-surface-700 border-gray-200 dark:border-surface-500
                     text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-600
                     transition-colors"
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Card */}
      <div className="card w-full max-w-md p-8
                      dark:bg-[#111827] dark:border-[#1e2a3a] dark:shadow-[0_0_40px_rgba(99,102,241,0.06)]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={dark ? logoDark : logoLight} alt="Kanbot" className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t.auth.welcomeBack}
          </h1>
        </div>

        {/* Expired session banner */}
        {expired && !error && (
          <div className="flex items-center gap-2.5 mb-4 px-3.5 py-3 rounded-lg text-sm
                          bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50
                          text-amber-700 dark:text-amber-400">
            <AlertCircle size={15} className="shrink-0" />
            Your session has expired. Please log in again.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 mb-4 px-3.5 py-3 rounded-lg text-sm
                          bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50
                          text-red-700 dark:text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t.auth.email}</label>
            <input type="email" className="input" autoFocus required
                   value={form.email} onChange={(e) => set('email', e.target.value)}
                   placeholder={t.auth.emailPlaceholder} />
          </div>
          <div>
            <label className="label">{t.auth.password}</label>
            <input type="password" className="input" required
                   value={form.password} onChange={(e) => set('password', e.target.value)}
                   placeholder={t.auth.passwordPlaceholder} />
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
            {loading ? <Spinner size="sm" /> : t.auth.login}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {t.auth.noAccount}{' '}
          <Link to="/register"
                className="font-semibold text-brand-600 dark:text-brand-400
                           hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            {t.auth.createOne}
          </Link>
        </p>

        {/* <div className="flex justify-center mt-3">
          <button onClick={toggleLang}
                  className="text-xs text-gray-400 dark:text-gray-500
                             hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
        </div> */}
      </div>
    </div>
  );
}
