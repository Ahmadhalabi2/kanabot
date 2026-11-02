import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('kanbot_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('kanbot_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}
