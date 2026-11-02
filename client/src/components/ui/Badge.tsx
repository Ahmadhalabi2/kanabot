import type { TodoPriority, TodoStatus, TodoType } from '../../types/api';
import { useLang } from '../../context/LanguageContext';

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const { t } = useLang();
  const styles: Record<TodoPriority, string> = {
    low:    'bg-gray-100 text-gray-500 dark:bg-surface-600 dark:text-gray-400',
    medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    high:   'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    urgent: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  };
  const labels: Record<TodoPriority, string> = {
    low: t.backlog.priority_low,
    medium: t.backlog.priority_medium,
    high: t.backlog.priority_high,
    urgent: t.backlog.priority_urgent,
  };
  return <span className={`badge ${styles[priority]}`}>{labels[priority]}</span>;
}

export function StatusBadge({ status }: { status: TodoStatus }) {
  const { t } = useLang();
  const styles: Record<TodoStatus, string> = {
    todo:        'bg-gray-100 text-gray-500 dark:bg-surface-600 dark:text-gray-400',
    in_progress: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
    in_review:   'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    done:        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  };
  const labels: Record<TodoStatus, string> = {
    todo:        t.todo.status_todo,
    in_progress: t.todo.status_in_progress,
    in_review:   t.todo.status_in_review,
    done:        t.todo.status_done,
  };
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}

export function TypeBadge({ type }: { type: TodoType }) {
  const { t } = useLang();
  const styles: Record<TodoType, string> = {
    task:  'bg-gray-100 text-gray-500 dark:bg-surface-600 dark:text-gray-400',
    story: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
    bug:   'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  };
  const labels: Record<TodoType, string> = {
    task:  t.todo.type_task,
    story: t.todo.type_story,
    bug:   t.todo.type_bug,
  };
  return <span className={`badge ${styles[type]}`}>{labels[type]}</span>;
}
