import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { ai as aiApi, todos as todosApi, sprints as sprintsApi } from '../../lib/api';
import type { PlanSprintResponse, Todo } from '../../types/api';
import { Spinner } from '../ui/Spinner';
import { useLang } from '../../context/LanguageContext';

interface Props { projectId: string; open: boolean; onClose: () => void; onCreated: () => void; }

const SPRINT_LENGTHS = [
  { value: '1week',  label: '1 week'  },
  { value: '2weeks', label: '2 weeks' },
  { value: '3weeks', label: '3 weeks' },
  { value: '4weeks', label: '4 weeks' },
];

export function PlanSprintModal({ projectId, open, onClose, onCreated }: Props) {
  const { t } = useLang();
  const [capacity, setCapacity]   = useState(30);
  const [sprintLength, setSprintLength] = useState('2weeks');
  const [focus, setFocus]         = useState('');
  const [plan, setPlan]           = useState<PlanSprintResponse | null>(null);
  const [backlogTodos, setBacklogTodos] = useState<Todo[]>([]);
  const [selectedIds, setSelectedIds]  = useState<Set<string>>(new Set());
  const [generating, setGenerating]    = useState(false);
  const [creating, setCreating]        = useState(false);
  const [error, setError]              = useState('');

  useEffect(() => {
    if (open) { todosApi.list(projectId, { sprintId: 'backlog' }).then(setBacklogTodos); }
  }, [open, projectId]);

  if (!open) return null;

  const suggest = async () => {
    setError(''); setGenerating(true);
    try {
      const res = await aiApi.planSprint(projectId, capacity, focus || undefined);
      setPlan(res);
      setSelectedIds(new Set(res.todoIds));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.ai.planningFailed);
    } finally { setGenerating(false); }
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const createSprint = async () => {
    if (!plan) return;
    setCreating(true);
    try {
      await sprintsApi.create(projectId, { goal: plan.goal, todoIds: [...selectedIds] });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally { setCreating(false); }
  };

  const todoById = new Map(backlogTodos.map((todo) => [todo.id, todo]));
  const planTodos = plan ? plan.todoIds.map((id) => todoById.get(id)).filter(Boolean) as Todo[] : [];
  const remainingTodos = backlogTodos.filter((todo) => !plan || !plan.todoIds.includes(todo.id));
  const displayTodos = plan ? [...planTodos, ...remainingTodos] : backlogTodos;
  const selectedPts = [...selectedIds].reduce((s, id) => s + (todoById.get(id)?.storyPoints ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-surface-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-surface-600">
          <Zap size={16} className="text-gray-700 dark:text-gray-300" />
          <h2 className="font-semibold text-gray-900 dark:text-white">{t.ai.planSprintTitle}</h2>
          <button className="ms-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-end gap-3 mb-5">
            <div className="w-36">
              <label className="label">{t.ai.capacityLabel}</label>
              <input type="number" className="input" min={1} max={200} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            <div className="w-36">
              <label className="label">{t.ai.sprintLengthLabel}</label>
              <select className="input" value={sprintLength} onChange={(e) => setSprintLength(e.target.value)}>
                {SPRINT_LENGTHS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="label">{t.ai.focusLabel}</label>
              <input className="input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder={t.ai.focusPlaceholderModal} maxLength={300} />
            </div>
            <button className="btn-primary whitespace-nowrap" onClick={suggest} disabled={generating}>
              {generating ? <Spinner size="sm" /> : <Zap size={14} />} {t.ai.suggestPlanBtn}
            </button>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {plan?.goal && (
            <div className="mb-4">
              <label className="label">{t.ai.suggestedSprintGoal}</label>
              <div className="input bg-gray-50 dark:bg-surface-600 text-gray-700 dark:text-gray-200">{plan.goal}</div>
            </div>
          )}

          {displayTodos.length > 0 && (
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.ai.selectedBacklogTodos}</p>
                <div className="border border-gray-200 dark:border-surface-600 rounded-lg overflow-hidden">
                  {displayTodos.map((todo) => {
                    const isSelected = selectedIds.has(todo.id);
                    const isFromPlan = plan?.todoIds.includes(todo.id);
                    return (
                      <label key={todo.id} className={`flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 dark:border-surface-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!isFromPlan && !isSelected ? 'opacity-60' : ''}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggle(todo.id)} className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                        <span className="text-xs text-gray-400 font-mono w-14 shrink-0">{todo.key}</span>
                        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">{todo.title}</span>
                        <span className="text-xs text-gray-400 w-12 text-end shrink-0">{todo.storyPoints ? `${todo.storyPoints} pts` : '—'}</span>
                      </label>
                    );
                  })}
                  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{t.ai.total}</span>
                    <div className="w-40 h-1.5 bg-gray-200 dark:bg-surface-500 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${selectedPts > capacity ? 'bg-red-400' : 'bg-gray-800 dark:bg-gray-300'}`}
                           style={{ width: `${Math.min(100, (selectedPts / capacity) * 100)}%` }} />
                    </div>
                    <span className={`text-sm font-medium ${selectedPts > capacity ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      {selectedPts} / {capacity} pts
                    </span>
                  </div>
                </div>
              </div>

              {plan?.reasoning && (
                <div className="w-64 shrink-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.ai.whyThisPlan}</p>
                  <div className="border border-gray-200 dark:border-surface-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-400 leading-relaxed h-full">
                    <p className="text-xs text-gray-400 font-medium mb-2">{t.ai.aiReasoning}</p>
                    <p className="whitespace-pre-wrap">{plan.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {backlogTodos.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">{t.ai.emptyBacklog}</p>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-surface-600">
          <button className="btn-secondary" onClick={onClose}>{t.common.cancel}</button>
          {plan && (
            <button className="btn-primary" onClick={createSprint} disabled={creating || selectedIds.size === 0}>
              {creating ? <Spinner size="sm" /> : null} {t.ai.createSprintWith(selectedIds.size)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
