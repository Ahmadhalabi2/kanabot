import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { ai as aiApi, todos as todosApi } from '../../lib/api';
import type { DraftTodo, TodoType, TodoPriority } from '../../types/api';
import { TODO_TYPES, TODO_PRIORITIES, STORY_POINTS } from '../../types/api';
import { Spinner } from '../ui/Spinner';
import { ModalOverlay } from '../ui/ModalOverlay';
import { useLang } from '../../context/LanguageContext';

interface Props { projectId: string; open: boolean; onClose: () => void; onSaved: () => void; }
type EditableDraft = DraftTodo & { selected: boolean };

export function GenerateTodosModal({ projectId, open, onClose, onSaved }: Props) {
  const { t } = useLang();
  const [prompt, setPrompt]       = useState('');
  const [drafts, setDrafts]       = useState<EditableDraft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  if (!open) return null;

  const generate = async () => {
    if (!prompt.trim()) return;
    setError(''); setGenerating(true);
    try {
      const res = await aiApi.generateTodos(projectId, prompt, 5);
      setDrafts(res.todos.map((d) => ({ ...d, selected: true })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.generationFailed);
    } finally { setGenerating(false); }
  };

  const toggleAll = () => {
    const allSelected = drafts.every((d) => d.selected);
    setDrafts((prev) => prev.map((d) => ({ ...d, selected: !allSelected })));
  };
  const toggle = (i: number) => setDrafts((prev) => prev.map((d, idx) => idx === i ? { ...d, selected: !d.selected } : d));
  const updateDraft = (i: number, field: keyof DraftTodo, value: unknown) =>
    setDrafts((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const save = async () => {
    const selected = drafts.filter((d) => d.selected);
    if (!selected.length) return;
    setSaving(true);
    try {
      await todosApi.bulk(projectId, { todos: selected.map(({ selected: _s, ...d }) => ({ ...d, sprintId: null })) });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.saveFailed);
    } finally { setSaving(false); }
  };

  const selectedCount = drafts.filter((d) => d.selected).length;
  const totalPts = drafts.filter((d) => d.selected).reduce((s, d) => s + (d.storyPoints ?? 0), 0);

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="bg-white dark:bg-surface-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-surface-600">
          <Sparkles size={16} className="text-gray-700 dark:text-gray-300" />
          <h2 className="font-semibold text-gray-900 dark:text-white">{t.ai.generateTodosTitle}</h2>
          <button className="ms-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="label">{t.ai.describeFeatureLabel}</label>
            <textarea className="input resize-none" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t.ai.describeFeaturePlaceholder} />
            <p className="text-xs text-gray-400 mt-1">{t.ai.draftsNotSaved}</p>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={generate} disabled={generating || !prompt.trim()}>
              {generating ? <Spinner size="sm" /> : <Sparkles size={14} />} {t.common.generate}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {drafts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.ai.suggestedTodos(drafts.length)}</p>
                <button className="text-xs text-gray-500 hover:text-gray-800 underline" onClick={toggleAll}>
                  {drafts.every((d) => d.selected) ? t.ai.deselectAll : t.ai.selectAll}
                </button>
              </div>
              <div className="grid grid-cols-[24px_1fr_100px_100px_70px] gap-2 px-2 py-1 text-xs text-gray-400 font-medium border-b border-gray-200 dark:border-surface-600">
                <span /><span>{t.ai.tableTitle}</span><span>{t.ai.tableType}</span><span>{t.ai.tablePriority}</span><span>{t.ai.tablePts}</span>
              </div>
              {drafts.map((draft, i) => (
                <div key={i} className="grid grid-cols-[24px_1fr_100px_100px_70px] gap-2 items-center px-2 py-2 border-b border-gray-100 dark:border-surface-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input type="checkbox" checked={draft.selected} onChange={() => toggle(i)} className="w-4 h-4 rounded border-gray-300 text-gray-900 accent-gray-900" />
                  <input className="input text-sm py-1" value={draft.title} onChange={(e) => updateDraft(i, 'title', e.target.value)} />
                  <select className="input text-xs py-1" value={draft.type} onChange={(e) => updateDraft(i, 'type', e.target.value as TodoType)}>
                    {TODO_TYPES.map((tp) => <option key={tp} value={tp}>{tp.charAt(0).toUpperCase() + tp.slice(1)}</option>)}
                  </select>
                  <select className="input text-xs py-1" value={draft.priority} onChange={(e) => updateDraft(i, 'priority', e.target.value as TodoPriority)}>
                    {TODO_PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                  <input type="number" min={0} max={13} className="input text-xs py-1" value={draft.storyPoints ?? ''}
                    onChange={(e) => { const n = Number(e.target.value); updateDraft(i, 'storyPoints', STORY_POINTS.includes(n as typeof STORY_POINTS[number]) ? n : null); }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {drafts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-surface-600">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.ai.totalPts(totalPts)}</span>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={onClose}>{t.common.cancel}</button>
              <button className="btn-primary" onClick={save} disabled={saving || selectedCount === 0}>
                {saving ? <Spinner size="sm" /> : null}
                {t.ai.addSelected(selectedCount)}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
