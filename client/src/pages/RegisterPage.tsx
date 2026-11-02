import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Languages } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { auth } from '../lib/api';
import logoLight from '../assets/kanbot-logo.svg';
import logoDark  from '../assets/kanbot-logo-dark.svg';

export function RegisterPage() {
  const { login }               = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [dark, setDark]         = useDarkMode();
  const navigate                = useNavigate();
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const set = (f: string, v: string) => {
    setForm((p) => ({ ...p, [f]: v }));
    setErrors((e) => ({ ...e, [f]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim())              errs.name     = t.auth.nameRequired;
    if (form.password.length < 8)       errs.password = t.auth.passwordMin;
    if (form.password !== form.confirm) errs.confirm  = t.auth.passwordMismatch;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const data = await auth.register({ name: form.name, email: form.email, password: form.password });
      login(data.token, data.user);
      navigate('/projects');
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : t.auth.registerFailed });
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
      <div className="card w-full max-w-md p-8 my-4
                      dark:bg-[#111827] dark:border-[#1e2a3a] dark:shadow-[0_0_40px_rgba(99,102,241,0.06)]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={dark ? logoDark : logoLight} alt="Kanbot" className="h-8 w-auto" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t.auth.createAccount}
          </h1>
        </div>

        {/* General error */}
        {errors.general && (
          <div className="mb-4 px-3.5 py-3 rounded-lg text-sm
                          bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50
                          text-red-700 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t.auth.name}</label>
            <input className="input" autoFocus required maxLength={80}
                   value={form.name} onChange={(e) => set('name', e.target.value)}
                   placeholder={t.auth.namePlaceholder} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <label className="label">{t.auth.email}</label>
            <input type="email" className="input" required
                   value={form.email} onChange={(e) => set('email', e.target.value)}
                   placeholder={t.auth.emailPlaceholder} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <label className="label">{t.auth.password}</label>
            <input type="password" className="input" required
                   value={form.password} onChange={(e) => set('password', e.target.value)}
                   placeholder={t.auth.passwordPlaceholder} />
            {errors.password
              ? <p className="field-error">{errors.password}</p>
              : <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.auth.passwordHint}</p>}
          </div>
          <div>
            <label className="label">{t.auth.confirmPassword}</label>
            <input type="password" className="input" required
                   value={form.confirm} onChange={(e) => set('confirm', e.target.value)}
                   placeholder={t.auth.passwordPlaceholder} />
            {errors.confirm && <p className="field-error">{errors.confirm}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
            {loading ? <Spinner size="sm" /> : t.auth.register}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          {t.auth.alreadyHave}{' '}
          <Link to="/login"
                className="font-semibold text-brand-600 dark:text-brand-400
                           hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            {t.auth.login}
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
