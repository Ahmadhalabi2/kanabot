import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms — default 3500
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error:   (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info:    (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${++counter.current}`;
    setToasts((p) => [...p, { id, type, message, duration }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const success = useCallback((m: string, d?: number) => toast(m, 'success', d), [toast]);
  const error   = useCallback((m: string, d?: number) => toast(m, 'error',   d ?? 5000), [toast]);
  const warning = useCallback((m: string, d?: number) => toast(m, 'warning', d), [toast]);
  const info    = useCallback((m: string, d?: number) => toast(m, 'info',    d), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ── Single toast item ──────────────────────────────────── */
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle      size={15} />,
  warning: <AlertCircle  size={15} />,
  info:    <Info          size={15} />,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
  error:   'bg-red-50     dark:bg-red-900/30     border-red-200     dark:border-red-700     text-red-800     dark:text-red-300',
  warning: 'bg-amber-50   dark:bg-amber-900/30   border-amber-200   dark:border-amber-700   text-amber-800   dark:text-amber-300',
  info:    'bg-violet-50  dark:bg-violet-900/30  border-violet-200  dark:border-violet-700  text-violet-800  dark:text-violet-300',
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium
        transition-all duration-300 cursor-pointer max-w-sm w-full
        ${STYLES[t.type]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      `}
      onClick={onDismiss}
    >
      <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
      <span className="flex-1 leading-snug">{t.message}</span>
      <button className="shrink-0 opacity-50 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>
        <X size={13} />
      </button>
    </div>
  );
}

/* ── Container ──────────────────────────────────────────── */
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
