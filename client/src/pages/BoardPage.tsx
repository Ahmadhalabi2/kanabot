import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Bot, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { sprints as sprintsApi, todos as todosApi } from '../lib/api';
import type { Todo, TodoStatus, SprintBoardResponse, Sprint } from '../types/api';
import { Spinner } from '../components/ui/Spinner';
import { TodoDetailModal } from '../components/TodoDetailModal';
import { AiDrawer } from '../components/ai/AiDrawer';
import { CompleteSprintModal } from '../components/ai/CompleteSprintModal';
import { BoardSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useLang } from '../context/LanguageContext';

/* ── Column config built at runtime with i18n ── */
function getColumns(t: ReturnType<typeof useLang>['t']): {
  id: TodoStatus; label: string; accent: string; countBg: string;
}[] {
  return [
    { id: 'todo',        label: t.board.col_todo,        accent: 'border-gray-300 dark:border-surface-500',   countBg: 'bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-300' },
    { id: 'in_progress', label: t.board.col_in_progress, accent: 'border-brand-400 dark:border-brand-600',    countBg: 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400' },
    { id: 'in_review',   label: t.board.col_in_review,   accent: 'border-violet-400 dark:border-violet-600',  countBg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
    { id: 'done',        label: t.board.col_done,        accent: 'border-emerald-400 dark:border-emerald-600',countBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
  ];
}

const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-gray-300 dark:bg-surface-500',
  medium: 'bg-sky-400',
  high:   'bg-amber-400',
  urgent: 'bg-red-500',
};

/* ── Todo card ────────────────────────────────────────── */
function TodoCard({
  todo,
  onClick,
  overlay = false,
}: {
  todo: Todo;
  onClick?: () => void;
  overlay?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`card p-3.5 cursor-pointer
                  hover:border-brand-300 dark:hover:border-brand-700/70
                  hover:shadow-md transition-all duration-150 select-none
                  ${overlay ? 'rotate-1 shadow-xl' : ''}`}
    >
      {/* key + points */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-300">
          {todo.key}
        </span>
        {todo.storyPoints && (
          <span className="badge bg-gray-100 dark:bg-surface-700
                           text-gray-500 dark:text-gray-300 text-[10px] tabular-nums">
            {todo.storyPoints} pt
          </span>
        )}
      </div>

      {/* title */}
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug mb-3">
        {todo.title}
      </p>

      {/* footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="badge bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-300 text-[10px]">
          {todo.type.charAt(0).toUpperCase() + todo.type.slice(1)}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[todo.priority]}`} />
          <span className="text-[10px] text-gray-400 dark:text-gray-300 capitalize">
            {todo.priority}
          </span>
        </div>
      </div>

      {/* due date */}
      {todo.dueDate && (
        <p className="text-[10px] text-gray-400 dark:text-gray-300 mt-2">
          Due {todo.dueDate}
        </p>
      )}
    </div>
  );
}

/* ── Sortable wrapper ─────────────────────────────────── */
function SortableCard({ todo, onClick }: { todo: Todo; onClick: () => void }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: todo.id, data: { todo, status: todo.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-30' : ''}
    >
      <TodoCard todo={todo} onClick={onClick} />
    </div>
  );
}

/* ── Column ───────────────────────────────────────────── */
function Column({
  id, label, accent, countBg, todos, onCardClick, onAddClick,
}: {
  id: TodoStatus; label: string; accent: string; countBg: string;
  todos: Todo[];
  onCardClick: (t: Todo) => void;
  onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col flex-1 min-w-[160px] sm:min-w-[220px] max-w-xs">
      {/* column header */}
      <div className={`flex items-center justify-between mb-3
                       pb-2.5 border-b-2 ${accent}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className={`badge ${countBg} text-[10px] tabular-nums`}>
            {todos.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="btn-ghost w-6 h-6 p-0 rounded-md"
          title={`Add to ${label}`}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 rounded-xl p-1 min-h-20
                    transition-colors duration-150
                    ${isOver
                      ? 'bg-brand-50/60 dark:bg-brand-950/20 ring-1 ring-brand-200 dark:ring-brand-800/40'
                      : ''}`}
      >
        <SortableContext
          items={todos.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {todos.map((t) => (
            <SortableCard key={t.id} todo={t} onClick={() => onCardClick(t)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { t }         = useLang();
  const COLUMNS       = getColumns(t);

  const [board, setBoard]       = useState<SprintBoardResponse | null>(null);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeDrag, setActiveDrag] = useState<Todo | null>(null);
  const [selected, setSelected] = useState<Todo | null>(null);
  const [aiOpen, setAiOpen]     = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<TodoStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const loadBoard = useCallback(async () => {
    if (!projectId) return;
    setLoadError('');
    try {
      const list = await sprintsApi.list(projectId);
      setAllSprints(list);
      const active = list.find((s) => s.status === 'active');
      if (!active) { setBoard(null); setLoading(false); return; }
      const data = await sprintsApi.board(active.id);
      setBoard(data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load board');
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  /* DnD */
  const onDragStart = ({ active }: DragStartEvent) =>
    setActiveDrag(active.data.current?.todo ?? null);

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveDrag(null);
    if (!over || !board) return;
    const dragged = active.data.current?.todo as Todo;
    const overId  = String(over.id);

    // Determine target status
    const targetStatus =
      COLUMNS.find((c) => c.id === overId)?.id ??
      (Object.entries(board.columns).find(([, arr]) =>
        arr.some((t) => t.id === overId),
      )?.[0] as TodoStatus | undefined) ??
      null;

    if (!targetStatus) return;

    // Calculate position: if dropped on a card, insert before it; if dropped on column, append
    const targetColumn = board.columns[targetStatus];
    const overIsColumn = COLUMNS.some((c) => c.id === overId);
    const overIndex    = overIsColumn ? targetColumn.length : targetColumn.findIndex((t) => t.id === overId);
    const position     = overIndex === -1 ? targetColumn.length : overIndex;

    // If same column and same position — nothing to do
    if (dragged.status === targetStatus) {
      const currentIndex = targetColumn.findIndex((t) => t.id === dragged.id);
      if (currentIndex === position || currentIndex === position - 1) return;
    }

    // Optimistic update
    setBoard((prev) => {
      if (!prev) return prev;
      const cols = { ...prev.columns };
      cols[dragged.status] = cols[dragged.status].filter((t) => t.id !== dragged.id);
      const target = [...cols[targetStatus]];
      const insertAt = overIsColumn ? target.length : target.findIndex((t) => t.id === overId);
      target.splice(insertAt === -1 ? target.length : insertAt, 0, { ...dragged, status: targetStatus });
      cols[targetStatus] = target;
      return { ...prev, columns: cols };
    });

    try {
      await todosApi.move(dragged.id, {
        status: targetStatus,
        sprintId: dragged.sprintId,
        position,
      });
      loadBoard();
    } catch { loadBoard(); }
  };

  /* quick-add todo in column */
  const handleAddInColumn = async (title: string) => {
    if (!projectId || !board || !addStatus) return;
    await todosApi.create(projectId, {
      title,
      sprintId: board.sprint.id,
      status: addStatus,
    });
    setAddStatus(null);
    loadBoard();
  };

  /* ── render ── */
  if (loading) return <BoardSkeleton />;
  if (loadError) return <ErrorState message={loadError} onRetry={loadBoard} />;

  if (!board) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-surface-750 flex items-center justify-center">
        <AlertCircle size={22} className="text-gray-400" />
      </div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{t.board.noActiveSprint}</p>
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{t.board.noActiveSprintHint}</p>
      </div>
      <button className="btn-primary mt-1" onClick={() => navigate(`/projects/${projectId}/sprints`)}>
        {t.board.goToSprints}
      </button>
    </div>
  );

  const { sprint, columns } = board;
  const progress = sprint.stats.totalPoints > 0
    ? (sprint.stats.donePoints / sprint.stats.totalPoints) * 100
    : 0;
  const daysLeft = sprint.endDate
    ? Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86_400_000)
    : null;
  const plannedSprints = allSprints.filter((s) => s.status === 'planned');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Page header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{t.board.title}</h1>
          <span className="badge bg-emerald-50 dark:bg-emerald-950/40
                           text-emerald-600 dark:text-emerald-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <button
          className="btn-ghost gap-2 text-sm"
          onClick={() => setAiOpen(true)}
        >
          <Bot size={15} />
          {t.board.askAi}
        </button>
      </div>

      {/* ── Sprint info bar ── */}
      <div className="px-4 sm:px-6 pt-4 pb-3 shrink-0
                      bg-white dark:bg-surface-850
                      border-b border-gray-200/60 dark:border-surface-600/50">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {sprint.name}
            </h2>
            {sprint.goal && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-0.5">
                {sprint.goal}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {sprint.startDate && sprint.endDate && (
              <span className="text-xs text-gray-400 dark:text-gray-300">
                {sprint.startDate} → {sprint.endDate}
                {daysLeft !== null && (
                  <span className={`ml-1.5 font-medium ${daysLeft < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    ({daysLeft < 0 ? t.board.overdue : t.board.daysLeft(daysLeft)})
                  </span>
                )}
              </span>
            )}
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {t.board.ptsDone(sprint.stats.donePoints, sprint.stats.totalPoints)}
            </span>
            <button className="btn-secondary text-xs py-1.5 gap-1.5" onClick={() => setAiOpen(true)}>
              <Zap size={13} /> {t.board.summarize}
            </button>
            <button className="btn-primary text-xs py-1.5 gap-1.5" onClick={() => setCompleteOpen(true)}>
              <CheckCircle2 size={13} /> {t.board.completeSprint}
            </button>
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full min-h-[400px]">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                {...col}
                todos={columns[col.id]}
                onCardClick={setSelected}
                onAddClick={() => setAddStatus(col.id)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDrag && <TodoCard todo={activeDrag} overlay />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Quick add inline */}
      {addStatus && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-6 bg-black/30 backdrop-blur-sm"
             onClick={() => setAddStatus(null)}>
          <div className="w-full max-w-md card p-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Add to <span className="capitalize">{addStatus.replace('_', ' ')}</span>
            </p>
            <QuickAddForm
              onSave={handleAddInColumn}
              onCancel={() => setAddStatus(null)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {selected && (
        <TodoDetailModal
          todo={selected} sprints={allSprints}
          open={!!selected}
          onClose={() => setSelected(null)}
          onUpdated={(t) => { loadBoard(); setSelected(t); }}
          onDeleted={() => { loadBoard(); setSelected(null); }}
        />
      )}

      <AiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        projectId={projectId!}
        activeSprint={sprint}
      />

      <CompleteSprintModal
        sprint={sprint}
        plannedSprints={plannedSprints}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onCompleted={() => {
          setCompleteOpen(false);
          navigate(`/projects/${projectId}/sprints`);
        }}
      />
    </div>
  );
}

/* ── Quick add form (used for column add) ─────────────── */
function QuickAddForm({ onSave, onCancel }: { onSave: (title: string) => Promise<void>; onCancel: () => void }) {
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try { await onSave(title.trim()); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Todo title…"
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary text-sm" onClick={onCancel}>{t.common.cancel}</button>
        <button className="btn-primary text-sm" onClick={save} disabled={saving || !title.trim()}>
          {saving && <Spinner size="sm" />} {t.common.add}
        </button>
      </div>
    </div>
  );
}
