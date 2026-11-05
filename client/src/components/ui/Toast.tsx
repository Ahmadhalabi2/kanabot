import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState, type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:        string;
  type:      ToastType;
  message:   string;
  duration?: number;
}

interface ToastCtx {
  toast:   (msg: string, type?: ToastType, duration?: number) => void;
  success: (msg: string, duration?: number) => void;
  error:   (msg: string, duration?: number) => void;
  warning: (msg: string, duration?: number) => void;
  info:    (msg: string, duration?: number) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

/* ── Provider ───────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = `t-${++counter.current}`;
      setToasts((p) => [...p, { id, type, message, duration }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const success = useCallback((m: string, d?: number) => toast(m, 'success', d),         [toast]);
  const error   = useCallback((m: string, d?: number) => toast(m, 'error',   d ?? 5000), [toast]);
  const warning = useCallback((m: string, d?: number) => toast(m, 'warning', d),         [toast]);
  const info    = useCallback((m: string, d?: number) => toast(m, 'info',    d),          [toast]);

  return (
    <Ctx.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Portal-style container — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ── Styles ─────────────────────────────────────────────── */
const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle      size={15} />,
  warning: <AlertCircle  size={15} />,
  info:    <Info          size={15} />,
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
  error:   'bg-red-50     dark:bg-red-900/40     border-red-200     dark:border-red-700     text-red-800     dark:text-red-300',
  warning: 'bg-amber-50   dark:bg-amber-900/40   border-amber-200   dark:border-amber-700   text-amber-800   dark:text-amber-300',
  info:    'bg-violet-50  dark:bg-violet-900/40  border-violet-200  dark:border-violet-700  text-violet-800  dark:text-violet-300',
};

/* ── Single toast ───────────────────────────────────────── */
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  // Two-phase: mount → invisible → visible (triggers CSS transition)
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Next frame → trigger enter transition
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 px-4 py-3
        rounded-2xl border shadow-lg shadow-black/10
        text-sm font-medium max-w-sm w-full
        cursor-pointer select-none
        ${COLORS[t.type]}
      `}
      style={{
        opacity:   show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
        transition: 'opacity 0.25s cubic-bezier(0.34,1.56,0.64,1), transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onClick={onDismiss}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
      <span className="flex-1 leading-snug">{t.message}</span>
      <button
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
