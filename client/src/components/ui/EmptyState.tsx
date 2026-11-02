import type { ReactNode } from 'react';

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-gray-300 dark:text-gray-600 mb-1">{icon}</div>}
      <p className="font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
