import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus, Search, X, Sparkles, Zap, MoreHorizontal, GripVertical, Bot } from 'lucide-react';
import { todos as todosApi, sprints as sprintsApi } from '../lib/api';
import type { Todo, Sprint, TodoPriority, TodoType } from '../types/api';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { FilterOption } from '../components/ui/FilterSelect';
import { useDebounce } from '../hooks/useDebounce';
import { GenerateTodosModal } from '../components/ai/GenerateTodosModal';
import { PlanSprintModal } from '../components/ai/PlanSprintModal';
import { AiDrawer } from '../components/ai/AiDrawer';
import { TodoDetailModal } from '../components/TodoDetailModal';
import { useToast } from '../components/ui/Toast';
import { useLang } from '../context/LanguageContext';
// import { FilterSelect } from '../components/ui/FilterSelect';
// import type { FilterOption } from '../components/ui/FilterSelect';

const PRIORITY_PILL: Record<TodoPriority, string> = {
  low:    'bg-gray-100 text-gray-500 dark:bg-surface-600 dark:text-gray-400',
  medium: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  high:   'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  urgent: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
};
const TYPE_PILL: Record<TodoType, string> = {
  task:  'bg-gray-100 text-gray-500 dark:bg-surface-600 dark:text-gray-400',
  story: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400',
  bug:   'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
};function TodoRow({ todo, onOpen }: { todo: Todo; onOpen: (t: Todo) => void }) {
  const { t } = useLang();
  return (
    <div className="todo-row" onClick={() => onOpen(todo)}>
      <GripVertical size={13} className="shrink-0 text-gray-300 dark:text-surface-500" />
      <span className="w-[72px] shrink-0 font-mono text-[11px] text-gray-400 dark:text-gray-500">{todo.key}</span>
      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">{todo.title}</span>
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <span className={`badge text-[11px] ${TYPE_PILL[todo.type]}`}>{t.backlog[`type_${todo.type}` as keyof typeof t.backlog] as string}</span>
        <span className={`badge text-[11px] ${PRIORITY_PILL[todo.priority]}`}>{t.backlog[`priority_${todo.priority}` as keyof typeof t.backlog] as string}</span>
        {todo.storyPoints && <span className="badge bg-gray-100 dark:bg-surface-600 text-gray-500 dark:text-gray-400 text-[11px] tabular-nums">{todo.storyPoints} pt</span>}
      </div>
      <button className="btn-ghost w-6 h-6 p-0 rounded opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onOpen(todo); }}>
        <MoreHorizontal size={13} />
      </button>
    </div>
  );
}

function InlineCreate({ onSave, onCancel }: { onSave: (title: string) => Promise<void>; onCancel: () => void }) {
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const save = async () => {
    if (!title.trim()) { onCancel(); return; }
    setSaving(true);
    try { await onSave(title.trim()); } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-surface-600/50 bg-brand-50/30 dark:bg-brand-950/10">
      <GripVertical size={13} className="shrink-0 text-transparent" />
      <span className="w-[72px] shrink-0" />
      <input
        ref={ref}
        className="flex-1 text-sm bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder={t.backlog.typeTitle}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        disabled={saving}
      />
      <div className="flex items-center gap-1.5 shrink-0">
        <button className="btn-primary py-1 px-3 text-xs" onClick={save} disabled={saving || !title.trim()}>
          {saving ? <Spinner size="sm" /> : t.common.save}
        </button>
        <button className="btn-ghost w-6 h-6 p-0" onClick={onCancel}><X size={12} /></button>
      </div>
    </div>
  );
}

function CreateSprintForm({ projectId, onCreated, onCancel }: { projectId: string; onCreated: (s: Sprint) => void; onCancel: () => void }) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const s = await sprintsApi.create(projectId, { name: form.name.trim() || undefined, goal: form.goal.trim() || undefined, startDate: form.startDate || null, endDate: form.endDate || null });
      onCreated(s);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t.common.error); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <label className="label">{t.backlog.sprintName} <span className="text-gray-400 font-normal text-xs">{t.backlog.sprintNameHint}</span></label>
        <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Sprint 1" autoFocus />
      </div>
      <div>
        <label className="label">{t.backlog.sprintGoal}</label>
        <input className="input" value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder={t.backlog.sprintGoalPlaceholder} maxLength={300} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">{t.backlog.startDate}</label><input type="date" className="input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
        <div><label className="label">{t.backlog.endDate}</label><input type="date" className="input" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading && <Spinner size="sm" />}{t.backlog.createSprintBtn}</button>
      </div>
    </form>
  );
}

function SprintSection({ sprint, todos, projectId, onTodoOpen, onTodoCreated, onSprintUpdated }: {
  sprint: Sprint; todos: Todo[]; projectId: string;
  onTodoOpen: (t: Todo) => void; onTodoCreated: (t: Todo) => void; onSprintUpdated: (s: Sprint) => void;
}) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [expanded, setExpanded]         = useState(true);
  const [inline, setInline]             = useState(false);
  const [startOpen, setStartOpen]       = useState(false);
  const [startForm, setStartForm]       = useState({ startDate: '', endDate: '' });
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError]     = useState('');
  const pts = todos.reduce((s, t) => s + (t.storyPoints ?? 0), 0);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartLoading(true); setStartError('');
    try {
      const s = await sprintsApi.start(sprint.id, {
        startDate: startForm.startDate || undefined,
        endDate:   startForm.endDate   || undefined,
      });
      onSprintUpdated(s);
      setStartOpen(false);
      navigate(`/projects/${projectId}/board`);
    } catch (err: unknown) {
      setStartError(err instanceof Error ? err.message : t.common.error);
    } finally { setStartLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 sticky top-14 z-10
                      bg-gray-50/95 dark:bg-surface-900/95 backdrop-blur-sm
                      border-b border-gray-200/60 dark:border-surface-600/40">
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setExpanded((e) => !e)}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{sprint.name}</span>
        {sprint.status === 'active' && (
          <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{t.backlog.activeLabel}
          </span>
        )}
        {sprint.startDate && sprint.endDate && <span className="text-[11px] text-gray-400 dark:text-gray-500">{sprint.startDate} → {sprint.endDate}</span>}
        <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1">· {t.backlog.todosCount(todos.length, pts)}</span>
        <div className="ml-auto flex items-center gap-2">
          {sprint.status === 'planned' && <button className="btn-primary text-xs py-1 px-3" onClick={() => setStartOpen(true)}>{t.backlog.startSprint}</button>}
          {sprint.status === 'active' && <button className="btn-secondary text-xs py-1 px-3" onClick={() => navigate(`/projects/${projectId}/board`)}>{t.board.title}</button>}
        </div>
      </div>
      {expanded && (
        <div>
          {todos.map((todo) => <TodoRow key={todo.id} todo={todo} onOpen={onTodoOpen} />)}
          {inline ? (
            <InlineCreate
              onSave={async (title) => { const todo = await todosApi.create(projectId, { title, sprintId: sprint.id }); onTodoCreated(todo); setInline(false); }}
              onCancel={() => setInline(false)}
            />
          ) : (
            <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/10 transition-colors" onClick={() => setInline(true)}>
              <Plus size={12} /> {t.backlog.createTodo}
            </button>
          )}
        </div>
      )}

      {/* ── Start Sprint Dialog ── */}
      <Modal open={startOpen} onClose={() => setStartOpen(false)} title={t.backlog.startSprint} size="sm">
        <form onSubmit={handleStart} className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Starting <span className="font-semibold text-gray-800 dark:text-gray-200">{sprint.name}</span> with {todos.length} todos.
          </p>
          {startError && <p className="text-sm text-red-500">{startError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t.backlog.startDate}</label>
              <input type="date" className="input" value={startForm.startDate}
                     onChange={(e) => setStartForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t.backlog.endDate}</label>
              <input type="date" className="input" value={startForm.endDate}
                     onChange={(e) => setStartForm((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setStartOpen(false)}>{t.common.cancel}</button>
            <button type="submit" className="btn-primary" disabled={startLoading}>
              {startLoading ? <Spinner size="sm" /> : null}
              {t.backlog.startSprint}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { t }    = useLang();
  const toast    = useToast();
  const [todoMap, setTodoMap]   = useState<Record<string, Todo[]>>({});
  const [backlog, setBacklog]   = useState<Todo[]>([]);
  const [sprints, setSprints]   = useState<Sprint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const debouncedSearch         = useDebounce(search, 300);
  const [filterPri, setFilterPri]   = useState<TodoPriority | ''>('');
  const [filterType, setFilterType] = useState<TodoType | ''>('');
  const [blExpanded, setBlExpanded] = useState(true);
  const [blInline, setBlInline]     = useState(false);
  const [selected, setSelected]     = useState<Todo | null>(null);
  const [genOpen, setGenOpen]       = useState(false);
  const [planOpen, setPlanOpen]     = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [aiOpen, setAiOpen]         = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    const [allTodos, allSprints] = await Promise.all([todosApi.list(projectId), sprintsApi.list(projectId)]);
    setSprints(allSprints);
    const map: Record<string, Todo[]> = {};
    const bl: Todo[] = [];
    for (const t of allTodos) { if (t.sprintId) { (map[t.sprintId] ??= []).push(t); } else { bl.push(t); } }
    setTodoMap(map); setBacklog(bl); setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const filter = (items: Todo[]) => items.filter((t) => {
    if (filterPri  && t.priority !== filterPri)  return false;
    if (filterType && t.type     !== filterType) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q);
    }
    return true;
  });

  const totalTodos = backlog.length + Object.values(todoMap).flat().length;
  const totalPts   = [...backlog, ...Object.values(todoMap).flat()].reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const nonDone    = sprints.filter((s) => s.status !== 'completed');
  const done       = sprints.filter((s) => s.status === 'completed');
  const blPts      = backlog.reduce((s, t) => s + (t.storyPoints ?? 0), 0);

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{t.backlog.title}</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500">{t.backlog.todosCount(totalTodos, totalPts)}</span>
        </div>
        <button className="btn-secondary text-xs py-1.5 ms-auto" onClick={() => setAiOpen(true)}>
          <Bot size={13} /> Ask AI
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap bg-white dark:bg-surface-800 border-b border-gray-200/60 dark:border-surface-600/50">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-xs py-1.5 w-48" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.backlog.searchPlaceholder} />
          {search && <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearch('')}><X size={11} /></button>}
        </div>
        <FilterSelect<TodoPriority>
          options={[
            { value: '',       label: t.backlog.priority },
            { value: 'urgent', label: t.backlog.priority_urgent, dot: 'bg-red-400' },
            { value: 'high',   label: t.backlog.priority_high,   dot: 'bg-amber-400' },
            { value: 'medium', label: t.backlog.priority_medium, dot: 'bg-sky-400' },
            { value: 'low',    label: t.backlog.priority_low,    dot: 'bg-gray-400' },
          ] as FilterOption<TodoPriority>[]}
          value={filterPri}
          onChange={(v) => setFilterPri(v as TodoPriority | '')}
        />
        <FilterSelect<TodoType>
          options={[
            { value: '',      label: t.backlog.type },
            { value: 'task',  label: t.backlog.type_task,  dot: 'bg-gray-400' },
            { value: 'story', label: t.backlog.type_story, dot: 'bg-purple-400' },
            { value: 'bug',   label: t.backlog.type_bug,   dot: 'bg-red-400' },
          ] as FilterOption<TodoType>[]}
          value={filterType}
          onChange={(v) => setFilterType(v as TodoType | '')}
        />
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-secondary text-xs py-1.5" onClick={() => setGenOpen(true)}><Sparkles size={13} /> {t.backlog.generateWithAi}</button>
          <button className="btn-secondary text-xs py-1.5" onClick={() => setPlanOpen(true)}><Zap size={13} /> {t.backlog.planSprintWithAi}</button>
          <button className="btn-primary text-xs py-1.5" onClick={() => setSprintOpen(true)}><Plus size={13} /> {t.backlog.createSprint}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {nonDone.map((sprint) => (
          <SprintSection key={sprint.id} sprint={sprint} todos={filter(todoMap[sprint.id] ?? [])} projectId={projectId!}
            onTodoOpen={setSelected}
            onTodoCreated={(t) => setTodoMap((p) => ({ ...p, [sprint.id]: [...(p[sprint.id] ?? []), t] }))}
            onSprintUpdated={(s) => setSprints((p) => p.map((x) => (x.id === s.id ? s : x)))} />
        ))}
        <div>
          <div className="flex items-center gap-2 px-4 py-2.5 sticky top-14 z-10 bg-gray-50/95 dark:bg-surface-900/95 backdrop-blur-sm border-b border-gray-200/60 dark:border-surface-600/40">
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setBlExpanded((e) => !e)}>
              {blExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t.backlog.title}</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1">· {t.backlog.todosCount(backlog.length, blPts)}</span>
          </div>
          {blExpanded && (
            <div>
              {filter(backlog).map((t) => <TodoRow key={t.id} todo={t} onOpen={setSelected} />)}
              {blInline ? (
                <InlineCreate
                  onSave={async (title) => { if (!projectId) return; const t = await todosApi.create(projectId, { title, sprintId: null }); setBacklog((p) => [t, ...p]); setBlInline(false); }}
                  onCancel={() => setBlInline(false)}
                />
              ) : (
                <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/10 transition-colors" onClick={() => setBlInline(true)}>
                  <Plus size={12} /> {t.backlog.createTodo}
                </button>
              )}
            </div>
          )}
        </div>
        {done.length > 0 && <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100 dark:border-surface-600/30">{t.backlog.completedSprints(done.length)}</p>}
      </div>

      {selected && <TodoDetailModal todo={selected} sprints={sprints} open={!!selected} onClose={() => setSelected(null)} onUpdated={(t) => { load(); setSelected(t); toast.success('Todo updated!'); }} onDeleted={() => { load(); setSelected(null); toast.success('Todo deleted.'); }} />}
      <GenerateTodosModal projectId={projectId!} open={genOpen} onClose={() => setGenOpen(false)} onSaved={() => { setGenOpen(false); load(); }} />
      <PlanSprintModal projectId={projectId!} open={planOpen} onClose={() => setPlanOpen(false)} onCreated={() => { setPlanOpen(false); load(); }} />
      <Modal open={sprintOpen} onClose={() => setSprintOpen(false)} title={t.backlog.newSprint}>
        <CreateSprintForm projectId={projectId!} onCreated={(s) => { setSprints((p) => [s, ...p]); setSprintOpen(false); }} onCancel={() => setSprintOpen(false)} />
      </Modal>
      <AiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        projectId={projectId!}
        onGenerateTodos={() => { setAiOpen(false); setGenOpen(true); }}
        onPlanSprint={() => { setAiOpen(false); setPlanOpen(true); }}
      />
    </div>
  );
}
