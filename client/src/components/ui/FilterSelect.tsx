import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterOption<T extends string> {
  value: T | '';
  label: string;
  dot?: string; // bg-* colour class, e.g. 'bg-red-400'
}

interface FilterSelectProps<T extends string> {
  options: FilterOption<T>[];
  value: T | '';
  onChange: (v: T | '') => void;
  className?: string;
}

export function FilterSelect<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isActive = !!selected?.value;
  const label    = selected?.value ? selected.label : (options[0]?.label ?? '');

  return (
    <div ref={ref} className={`relative ${className}`}>

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
          'border transition-all select-none cursor-pointer',
          isActive
            ? 'bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
        ].join(' ')}
      >
        {isActive && selected?.dot && (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot} opacity-80`} />
        )}
        <span>{label}</span>
        <ChevronDown
          size={11}
          className={`opacity-50 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute top-full start-0 mt-1.5 z-50 min-w-[150px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">

          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value as T | ''); setOpen(false); }}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-start transition-colors',
                opt.value === value
                  ? 'bg-gray-50 dark:bg-gray-700/60'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/40',
              ].join(' ')}
            >
              {/* colour dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot ?? 'bg-gray-200 dark:bg-gray-600'}`} />

              {/* label */}
              <span className={[
                'flex-1 font-medium',
                opt.value
                  ? 'text-gray-700 dark:text-gray-200'
                  : 'text-gray-400 dark:text-gray-500',
              ].join(' ')}>
                {opt.label}
              </span>

              {/* checkmark */}
              {opt.value === value && opt.value !== '' && (
                <Check size={11} className="text-gray-500 dark:text-gray-400 shrink-0" />
              )}
            </button>
          ))}

        </div>
      )}
    </div>
  );
}
