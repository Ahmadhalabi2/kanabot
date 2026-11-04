import { useState } from 'react';
import { X } from 'lucide-react';
import { todos as todosApi } from '../lib/api';
import type { Todo, Sprint, TodoStatus, TodoPriority, TodoType, StoryPoints } from '../types/api';
import { TODO_STATUSES, TODO_PRIORITIES, TODO_TYPES, STORY_POINTS } from '../types/api';
import { Spinner } from './ui/Spinner';
import { useLang } from '../context/LanguageContext';

interface Props {
  todo: Todo;
  sprints?: Sprint[];
  open: boolean;
  onClose: () => void;
  onUpdated: (t: Todo) => void;
  onDeleted: (id: string) => void;
}

export function TodoDetailModal({ todo, sprints = [], open, onClose, onUpdated, onDeleted }: Props) {
  const { t } = useLang();
  const initialForm = {
    title:       todo.title,
    description: todo.description,
    status:      todo.status,
    priority:    todo.priority,
    type:        todo.type,
    storyPoints: todo.storyPoints,
    sprintId:    todo.sprintId,
    labels:      todo.labels.join(', '),
    dueDate:     todo.dueDate ?? '',
  };
  const [form, setForm]         = useState(initialForm);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  if (!open) return null;

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleClose = () => {
    if (isDirty && !confirm('You have unsaved changes. Discard them?')) return;
    onClose();
  };

  const set = (f: string, v: unknown) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError(t.todo.titleRequired); return; }
    setSaving(true); setError('');
    try {
      const updated = await todosApi.update(todo.id, {
        title:       form.title.trim(),
        description: form.description,
        status:      form.status as TodoStatus,
        priority:    form.priority as TodoPriority,
        type:        form.type as TodoType,
        storyPoints: form.storyPoints as StoryPoints | null,
        sprintId:    form.sprintId,
        labels:      form.labels.split(',').map((l) => l.trim()).filter(Boolean),
        dueDate:     form.dueDate || null,
      });
      onUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.todo.saveFailed);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(t.todo.deleteConfirm(todo.title))) return;
    setDeleting(true);
    try {
      await todosApi.delete(todo.id);
      onDeleted(todo.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.todo.deleteFailed);
      setDeleting(false);
    }
  };

  const eligibleSprints = sprints.filter((s) => s.status !== 'completed');

  /* ── helpers for translated option labels ── */
  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      todo: t.todo.status_todo, in_progress: t.todo.status_in_progress,
      in_review: t.todo.status_in_review, done: t.todo.status_done,
    };
    return map[s] ?? s;
  };
  const priorityLabel = (p: string) => {
    const map: Record<string, string> = {
      urgent: t.backlog.priority_urgent, high: t.backlog.priority_high,
      medium: t.backlog.priority_medium, low: t.backlog.priority_low,
    };
    return map[p] ?? p;
  };
  const typeLabel = (tp: string) => {
    const map: Record<string, string> = {
      task: t.todo.type_task, story: t.todo.type_story, bug: t.todo.type_bug,
    };
    return map[tp] ?? tp;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white dark:bg-surface-700 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-surface-600">
          <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-mono px-2 py-1 rounded">{todo.key}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {typeLabel(todo.type)} · {t.todo.created} {new Date(todo.createdAt).toLocaleDateString()}
          </span>
          <button className="ms-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={handleClose}><X size={18} /></button>
        </div>

        {error && (
          <div className="mx-6 mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded px-3 py-2">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-y-auto divide-x divide-gray-100 dark:divide-gray-700">
          {/* Left */}
          <div className="flex-1 p-6 space-y-4">
            <div>
              <label className="label">{t.todo.title}</label>
              <input className="input text-base font-medium" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">{t.todo.description}</label>
              <textarea className="input resize-none" rows={10} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t.todo.descriptionPlaceholder} />
            </div>
          </div>

          {/* Right */}
          <div className="w-72 shrink-0 p-6 space-y-4">
            <div>
              <label className="label">{t.todo.status}</label>
              <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {TODO_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.todo.priority}</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {TODO_PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.todo.type}</label>
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TODO_TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.todo.storyPoints}</label>
              <select className="input" value={form.storyPoints ?? ''} onChange={(e) => set('storyPoints', e.target.value ? Number(e.target.value) : null)}>
                <option value="">—</option>
                {STORY_POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.todo.sprint}</label>
              <select className="input" value={form.sprintId ?? ''} onChange={(e) => set('sprintId', e.target.value || null)}>
                <option value="">{t.todo.backlog}</option>
                {eligibleSprints.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t.todo.labels}</label>
              <input className="input" value={form.labels} onChange={(e) => set('labels', e.target.value)} placeholder={t.todo.labelsPlaceholder} />
            </div>
            <div>
              <label className="label">{t.todo.dueDate}</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-surface-600">
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" /> : null} {t.common.delete}
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={handleClose}>{t.common.cancel}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" /> : null} {t.common.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
