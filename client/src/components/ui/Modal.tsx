import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const [visible, setVisible]   = useState(false);
  const [rendered, setRendered] = useState(false);
  const closeTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Mount / unmount with animation
  useEffect(() => {
    if (open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      closeTimer.current = setTimeout(() => setRendered(false), 220);
    }
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, [open]);

  if (!rendered) return null;

  const w = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
        backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background-color 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full ${w[size]} flex flex-col max-h-[90vh]
                    bg-white dark:bg-surface-700
                    rounded-2xl border border-gray-200/80 dark:border-surface-500
                    shadow-2xl shadow-black/10 dark:shadow-black/50`}
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)',
          transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-gray-100 dark:border-surface-600">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-surface-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
