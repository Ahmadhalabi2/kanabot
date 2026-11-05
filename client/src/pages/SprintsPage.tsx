import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, RotateCcw, Kanban, CheckCircle2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sprints as sprintsApi, ai as aiApi } from '../lib/api';
import type { Sprint } from '../types/api';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { AiDrawer } from '../components/ai/AiDrawer';
import { CompleteSprintModal } from '../components/ai/CompleteSprintModal';
import { useToast } from '../components/ui/Toast';
import { SprintsSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useLang } from '../context/LanguageContext';

/* ── status helpers ───────────────────────────────────── */
const STATUS_BADGE: Record<string, string> = {
  planned:   'bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-gray-300',
  active:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  completed: 'bg-gray-100 text-gray-400 dark:bg-surface-700 dark:text-gray-400',
};
const STATUS_DOT: Record<string, string> = {
  planned:   'bg-gray-400',
  active:    'bg-emerald-500 animate-pulse',
  completed: 'bg-gray-300 dark:bg-surface-500',
};

/* ── Create sprint form ───────────────────────────────── */
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
      const s = await sprintsApi.create(projectId, {
        name:      form.name.trim() || undefined,
        goal:      form.goal.trim() || undefined,
        startDate: form.startDate || null,
        endDate:   form.endDate   || null,
      });
      onCreated(s);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <label className="label">
          {t.sprints.sprintName}{' '}
          <span className="text-gray-400 font-normal text-xs">{t.sprints.sprintNameHint}</span>
        </label>
        <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Sprint 1" autoFocus />
      </div>
      <div>
        <label className="label">{t.sprints.goal}</label>
        <input className="input" value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder={t.sprints.goalPlaceholder} maxLength={300} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">{t.sprints.startDate}</label><input type="date" className="input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
        <div><label className="label">{t.sprints.endDate}</label><input type="date" className="input" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>{t.common.cancel}</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading && <Spinner size="sm" />} {t.sprints.newSprint}</button>
      </div>
    </form>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate      = useNavigate();
  const { t }         = useLang();
  const toast         = useToast();

  const [list, setList]           = useState<Sprint[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected]   = useState<Sprint | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen]       = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [summarizing, setSummarizing]   = useState(false);
  const [summaryText, setSummaryText]   = useState('');

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoadError('');
    try {
      const data = await sprintsApi.list(projectId);
      setList(data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load sprints');
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  /* auto-select first sprint */
  useEffect(() => {
    if (list.length && !selected) setSelected(list[0]);
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (s: Sprint) => { setSelected(s); setSummaryText(''); };

  const handleSummarize = async () => {
    if (!selected) return;
    setSummarizing(true); setSummaryText('');
    try {
      const res = await aiApi.summarizeSprint(selected.id);
      setSummaryText(res.summary.content);
      setList((p) => p.map((s) => (s.id === res.sprint.id ? res.sprint : s)));
      setSelected(res.sprint);
      toast.success('Summary generated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally { setSummarizing(false); }
  };

  if (loading) return <SprintsSkeleton />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  const plannedSprints  = list.filter((s) => s.status === 'planned');
  const stats           = selected?.status === 'completed'
    ? selected.completedStats : selected?.stats;
  const displaySummary  = summaryText || selected?.summary?.content;
  const pct             = stats && stats.totalPoints > 0
    ? Math.round((stats.donePoints / stats.totalPoints) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{t.sprints.title}</h1>
          <span className="badge bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-300">
            {list.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost gap-2 text-sm" onClick={() => setAiOpen(true)}>
            <Bot size={15} /> {t.sprints.askAi}
          </button>
          <button className="btn-primary gap-2 text-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> {t.sprints.newSprint}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: sprint list ── */}
        <div className="w-64 shrink-0 flex flex-col
                        border-r border-gray-200/60 dark:border-surface-600/50
                        bg-white dark:bg-surface-850 overflow-y-auto">
          <div className="p-3 space-y-1">
            <p className="section-label">{t.sprints.allSprints}</p>

            {list.length === 0 && (
              <p className="px-3 py-6 text-sm text-gray-400 dark:text-gray-300 text-center">
                {t.sprints.newSprint}
              </p>
            )}

            {list.map((sprint) => (
              <button
                key={sprint.id}
                onClick={() => handleSelect(sprint)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors
                            ${selected?.id === sprint.id
                              ? 'bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40'
                              : 'hover:bg-gray-50 dark:hover:bg-surface-700 border border-transparent'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-sm font-medium truncate
                                   ${selected?.id === sprint.id
                                     ? 'text-brand-700 dark:text-brand-300'
                                     : 'text-gray-800 dark:text-gray-200'}`}>
                    {sprint.name}
                  </span>
                  <span className={`badge shrink-0 text-[10px] ${STATUS_BADGE[sprint.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[sprint.status]}`} />
                {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                  </span>
                </div>
                {sprint.startDate && sprint.endDate && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-300">
                    {sprint.startDate} → {sprint.endDate}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5 tabular-nums">
                  {sprint.stats.donePoints}/{sprint.stats.totalPoints} pts
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: detail ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selected ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400 dark:text-gray-300">
                {t.sprints.selectSprint}
              </p>
            </div>
          ) : (
            <>
              {/* sprint title row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selected.name}
                    </h2>
                    <span className={`badge ${STATUS_BADGE[selected.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[selected.status]}`} />
                      {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                    </span>
                  </div>
                  {selected.startDate && selected.endDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                      {selected.startDate} → {selected.endDate}
                      {selected.goal && <span className="mx-2">·</span>}
                      {selected.goal && (
                        <span className="italic">{selected.goal}</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selected.status === 'active' && (
                    <>
                      <button
                        className="btn-secondary gap-2 text-sm"
                        onClick={() => navigate(`/projects/${projectId}/board`)}
                      >
                        <Kanban size={14} /> {t.sprints.viewBoard}
                      </button>
                      <button
                        className="btn-primary gap-2 text-sm"
                        onClick={() => setCompleteOpen(true)}
                      >
                        <CheckCircle2 size={14} /> {t.sprints.completeSprint}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* progress bar */}
              {stats && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-300">Progress</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* stats grid */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label={t.sprints.completedTodos} value={stats.doneTodos} sub={`of ${stats.totalTodos}`} />
                  <StatCard label={t.sprints.pointsDone} value={stats.donePoints} sub={`of ${stats.totalPoints}`} />
                  {selected.status === 'completed' && selected.completedStats && (
                    <StatCard label={t.sprints.carriedOver} value={selected.completedStats.carriedOver} sub="todos" />
                  )}
                  <StatCard label={t.sprints.completionPct} value={`${pct}%`} />
                </div>
              )}

              {/* {t.sprints.aiSummary} panel */}
              {(selected.status === 'active' || selected.status === 'completed') && (
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-brand-500" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {t.sprints.aiSummary}
                      </span>
                      {selected.summary && (
                        <span className="badge bg-gray-100 dark:bg-surface-700
                                         text-gray-400 dark:text-gray-300 text-[10px]">
                          {new Date(selected.summary.generatedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn-secondary gap-1.5 text-xs py-1.5"
                      onClick={handleSummarize}
                      disabled={summarizing}
                    >
                      {summarizing ? <Spinner size="sm" /> : <RotateCcw size={12} />}
                      {summarizing ? t.sprints.generating : t.sprints.regenerate}
                    </button>
                  </div>

                  {displaySummary ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert
                                    prose-headings:font-semibold prose-headings:text-gray-800
                                    dark:prose-headings:text-gray-200
                                    prose-p:text-gray-600 dark:prose-p:text-gray-400
                                    prose-li:text-gray-600 dark:prose-li:text-gray-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {displaySummary}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-300">
                      {t.sprints.noSummary}
                    </p>
                  )}

                  {selected.summary?.generatedAt && !summaryText && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-4 pt-3 border-t border-gray-100 dark:border-surface-600">
                      {selected.summary.source === 'ai' ? 'AI' : 'Mock'} · AI can make mistakes.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t.sprints.newSprint}>
        <CreateSprintForm
          projectId={projectId!}
          onCreated={(s) => {
            setList((p) => [s, ...p]);
            setSelected(s);
            setCreateOpen(false);
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {selected && (
        <CompleteSprintModal
          sprint={selected}
          plannedSprints={plannedSprints}
          open={completeOpen}
          onClose={() => setCompleteOpen(false)}
          onCompleted={(s) => {
            setList((p) => p.map((x) => (x.id === s.id ? s : x)));
            setSelected(s);
            setCompleteOpen(false);
            toast.success('Sprint completed!');
          }}
        />
      )}

      <AiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        projectId={projectId!}
        activeSprint={list.find((s) => s.status === 'active')}
      />
    </div>
  );
}
