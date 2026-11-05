/**
 * Reusable animated overlay for custom modals that don't use <Modal>.
 * Wrap your modal content with this.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** extra classes on the backdrop div */
  className?: string;
}

export function ModalOverlay({ open, onClose, children, className = '' }: ModalOverlayProps) {
  const [visible, setVisible]   = useState(false);
  const [rendered, setRendered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timer.current) clearTimeout(timer.current);
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      timer.current = setTimeout(() => setRendered(false), 220);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [open]);

  if (!rendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      style={{
        backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
        backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background-color 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)',
          transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.2,0.64,1)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
