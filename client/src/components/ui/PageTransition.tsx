import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset and replay animation on route change
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = '';
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-transition flex-1 flex flex-col min-w-0 overflow-hidden">
      {children}
    </div>
  );
}
