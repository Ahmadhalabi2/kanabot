import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ListTodo, Zap, FolderKanban, LogOut, ChevronDown,
  LayoutGrid, Bot, Sun, Moon, Languages, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { PageTransition } from '../ui/PageTransition';
import { projects as projectsApi } from '../../lib/api';
import type { ProjectWithStats } from '../../types/api';
import logoLight from '../../assets/kanbot-logo.svg';
import logoDark  from '../../assets/kanbot-logo-dark.svg';

/* ── Module-level SidebarContent — avoids remount on parent state changes ── */
interface SidebarContentProps {
  dark: boolean;
  user: { name?: string; email?: string } | null;
  lang: string;
  t: ReturnType<typeof useLang>['t'];
  projectId: string | undefined;
  current: ProjectWithStats | null;
  allProjects: ProjectWithStats[];
  switcherOpen: boolean;
  setSwitch: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement>;
  projectNav: { to: string; icon: React.ReactNode; label: string }[];
  setSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  toggleLang: () => void;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  navigate: ReturnType<typeof useNavigate>;
}

function SidebarContent({
  dark, user, lang, t, projectId, current, allProjects,
  switcherOpen, setSwitch, menuOpen, setMenuOpen, menuRef,
  projectNav, setSidebarOpen, handleLogout, toggleLang, setDark, navigate,
}: SidebarContentProps) {
  return (
    <>
      {/* Logo row */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <Link to="/projects" className="flex items-center select-none" onClick={() => setSidebarOpen(false)}>
          <img src={dark ? logoDark : logoLight} alt="Kanbot" className="h-7 w-auto" />
        </Link>
        {/* Close button — only visible on mobile */}
        <button
          className="md:hidden p-2.5 rounded-lg"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Project switcher */}
      {projectId && (
        <div className="px-2 pt-3 relative">
          <button
            onClick={() => setSwitch(!switcherOpen)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center font-bold text-[9px]"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {current?.key?.slice(0, 2) ?? '?'}
            </span>
            <span className="flex-1 truncate text-left">{current?.name ?? '…'}</span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>

          {switcherOpen && (
            <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto border"
                 style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              {allProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSwitch(false); navigate(`/projects/${p.id}/backlog`); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
                  style={{ color: p.id === projectId ? '#6366f1' : 'var(--text-secondary)', fontWeight: p.id === projectId ? 600 : 400 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center font-bold text-[9px]"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
                    {p.key.slice(0, 2)}
                  </span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <button
                onClick={() => { setSwitch(false); navigate('/projects'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LayoutGrid size={13} /> {t.nav.allProjects}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto">
        {projectId && (
          <>
            <p className="section-label">{t.nav.project}</p>
            {projectNav.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors
                   ${isActive ? 'nav-link-active' : 'nav-link-idle'}`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2" />
          </>
        )}
        <p className="section-label">{t.nav.account}</p>
        <NavLink
          to="/projects" end
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors
             ${(isActive && !projectId) ? 'nav-link-active' : 'nav-link-idle'}`
          }
        >
          <LayoutGrid size={15} /> {t.nav.projects}
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold select-none"
                 style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }}
                         className={`transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50 rounded-xl shadow-xl border py-1 overflow-hidden"
                 style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <button onClick={() => setDark((d) => !d)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}
                <span>{dark ? (lang === 'ar' ? 'الوضع النهاري' : 'Light mode') : (lang === 'ar' ? 'الوضع الليلي' : 'Dark mode')}</span>
              </button>
              <button onClick={toggleLang}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Languages size={14} />
                <span>{lang === 'en' ? 'العربية' : 'English'}</span>
              </button>
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left"
                      style={{ color: '#f87171' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <LogOut size={14} />
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── AppLayout ── */
export function AppLayout() {
  const { user, logout }              = useAuth();
  const { lang, toggleLang, t }       = useLang();
  const [dark, setDark]               = useDarkMode();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const { projectId }                 = useParams();
  const [allProjects, setAll]         = useState<ProjectWithStats[]>([]);
  const [current, setCurrent]         = useState<ProjectWithStats | null>(null);
  const [switcherOpen, setSwitch]     = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef                       = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    projectsApi.list().then((list) => {
      setAll(list);
      if (projectId) setCurrent(list.find((p) => p.id === projectId) ?? null);
    });
  }, [projectId]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const projectNav = projectId ? [
    { to: `/projects/${projectId}/backlog`,  icon: <ListTodo     size={15} />, label: t.nav.backlog      },
    { to: `/projects/${projectId}/board`,    icon: <Zap          size={15} />, label: t.nav.activeSprint },
    { to: `/projects/${projectId}/sprints`,  icon: <FolderKanban size={15} />, label: t.nav.sprints      },
    { to: `/projects/${projectId}/ai`,       icon: <Bot          size={15} />, label: t.nav.aiAssistant  },
  ] : [];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>

      {/* ════ MOBILE OVERLAY ════ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.25s ease' }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ════ SIDEBAR ════ */}
      <aside
        className={`sidebar-root flex flex-col z-50 w-56 shrink-0
                    fixed inset-y-0 left-0
                    transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        aria-label="Sidebar navigation"
      >
        <SidebarContent
          dark={dark}
          user={user}
          lang={lang}
          t={t}
          projectId={projectId}
          current={current}
          allProjects={allProjects}
          switcherOpen={switcherOpen}
          setSwitch={setSwitch}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuRef={menuRef}
          projectNav={projectNav}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
          toggleLang={toggleLang}
          setDark={setDark}
          navigate={navigate}
        />
      </aside>

      {/* ════ MAIN CONTENT ════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-56" style={{ backgroundColor: 'var(--bg-app)' }}>

        {/* ── Mobile top bar with hamburger ── */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 shrink-0
                        bg-white/90 dark:bg-surface-900/90 backdrop-blur-sm
                        border-b border-gray-200/60 dark:border-surface-600/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img src={dark ? logoDark : logoLight} alt="Kanbot" className="h-6 w-auto" />
        </div>

        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </div>
  );
}
